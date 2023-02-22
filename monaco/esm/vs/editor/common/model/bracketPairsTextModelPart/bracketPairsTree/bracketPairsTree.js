/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Emitter } from '../../../../../base/common/event.js';
import { Disposable } from '../../../../../base/common/lifecycle.js';
import { Range } from '../../../core/range.js';
import { BracketInfo, BracketPairWithMinIndentationInfo } from '../../../textModelBracketPairs.js';
import { TextEditInfo } from './beforeEditPositionMapper.js';
import { LanguageAgnosticBracketTokens } from './brackets.js';
import { lengthAdd, lengthGreaterThanEqual, lengthLessThan, lengthLessThanEqual, lengthOfString, lengthsToRange, lengthZero, positionToLength, toLength } from './length.js';
import { parseDocument } from './parser.js';
import { DenseKeyProvider } from './smallImmutableSet.js';
import { FastTokenizer, TextBufferTokenizer } from './tokenizer.js';
export class BracketPairsTree extends Disposable {
    constructor(textModel, getLanguageConfiguration) {
        super();
        this.textModel = textModel;
        this.getLanguageConfiguration = getLanguageConfiguration;
        this.didChangeEmitter = new Emitter();
        this.denseKeyProvider = new DenseKeyProvider();
        this.brackets = new LanguageAgnosticBracketTokens(this.denseKeyProvider, this.getLanguageConfiguration);
        this.onDidChange = this.didChangeEmitter.event;
        if (textModel.tokenization.backgroundTokenizationState === 0 /* BackgroundTokenizationState.Uninitialized */) {
            // There are no token information yet
            const brackets = this.brackets.getSingleLanguageBracketTokens(this.textModel.getLanguageId());
            const tokenizer = new FastTokenizer(this.textModel.getValue(), brackets);
            this.initialAstWithoutTokens = parseDocument(tokenizer, [], undefined, true);
            this.astWithTokens = this.initialAstWithoutTokens;
        }
        else if (textModel.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
            // Skip the initial ast, as there is no flickering.
            // Directly create the tree with token information.
            this.initialAstWithoutTokens = undefined;
            this.astWithTokens = this.parseDocumentFromTextBuffer([], undefined, false);
        }
        else if (textModel.tokenization.backgroundTokenizationState === 1 /* BackgroundTokenizationState.InProgress */) {
            this.initialAstWithoutTokens = this.parseDocumentFromTextBuffer([], undefined, true);
            this.astWithTokens = this.initialAstWithoutTokens;
        }
    }
    didLanguageChange(languageId) {
        return this.brackets.didLanguageChange(languageId);
    }
    //#region TextModel events
    handleDidChangeBackgroundTokenizationState() {
        if (this.textModel.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
            const wasUndefined = this.initialAstWithoutTokens === undefined;
            // Clear the initial tree as we can use the tree with token information now.
            this.initialAstWithoutTokens = undefined;
            if (!wasUndefined) {
                this.didChangeEmitter.fire();
            }
        }
    }
    handleDidChangeTokens({ ranges }) {
        const edits = ranges.map(r => new TextEditInfo(toLength(r.fromLineNumber - 1, 0), toLength(r.toLineNumber, 0), toLength(r.toLineNumber - r.fromLineNumber + 1, 0)));
        this.astWithTokens = this.parseDocumentFromTextBuffer(edits, this.astWithTokens, false);
        if (!this.initialAstWithoutTokens) {
            this.didChangeEmitter.fire();
        }
    }
    handleContentChanged(change) {
        const edits = change.changes.map(c => {
            const range = Range.lift(c.range);
            return new TextEditInfo(positionToLength(range.getStartPosition()), positionToLength(range.getEndPosition()), lengthOfString(c.text));
        }).reverse();
        this.astWithTokens = this.parseDocumentFromTextBuffer(edits, this.astWithTokens, false);
        if (this.initialAstWithoutTokens) {
            this.initialAstWithoutTokens = this.parseDocumentFromTextBuffer(edits, this.initialAstWithoutTokens, false);
        }
    }
    //#endregion
    /**
     * @pure (only if isPure = true)
    */
    parseDocumentFromTextBuffer(edits, previousAst, immutable) {
        // Is much faster if `isPure = false`.
        const isPure = false;
        const previousAstClone = isPure ? previousAst === null || previousAst === void 0 ? void 0 : previousAst.deepClone() : previousAst;
        const tokenizer = new TextBufferTokenizer(this.textModel, this.brackets);
        const result = parseDocument(tokenizer, edits, previousAstClone, immutable);
        return result;
    }
    getBracketsInRange(range) {
        const startOffset = toLength(range.startLineNumber - 1, range.startColumn - 1);
        const endOffset = toLength(range.endLineNumber - 1, range.endColumn - 1);
        const result = new Array();
        const node = this.initialAstWithoutTokens || this.astWithTokens;
        collectBrackets(node, lengthZero, node.length, startOffset, endOffset, result, 0, new Map());
        return result;
    }
    getBracketPairsInRange(range, includeMinIndentation) {
        const result = new Array();
        const startLength = positionToLength(range.getStartPosition());
        const endLength = positionToLength(range.getEndPosition());
        const node = this.initialAstWithoutTokens || this.astWithTokens;
        const context = new CollectBracketPairsContext(result, includeMinIndentation, this.textModel);
        collectBracketPairs(node, lengthZero, node.length, startLength, endLength, context, 0, new Map());
        return result;
    }
    getFirstBracketAfter(position) {
        const node = this.initialAstWithoutTokens || this.astWithTokens;
        return getFirstBracketAfter(node, lengthZero, node.length, positionToLength(position));
    }
    getFirstBracketBefore(position) {
        const node = this.initialAstWithoutTokens || this.astWithTokens;
        return getFirstBracketBefore(node, lengthZero, node.length, positionToLength(position));
    }
}
function getFirstBracketBefore(node, nodeOffsetStart, nodeOffsetEnd, position) {
    if (node.kind === 4 /* AstNodeKind.List */ || node.kind === 2 /* AstNodeKind.Pair */) {
        const lengths = [];
        for (const child of node.children) {
            nodeOffsetEnd = lengthAdd(nodeOffsetStart, child.length);
            lengths.push({ nodeOffsetStart, nodeOffsetEnd });
            nodeOffsetStart = nodeOffsetEnd;
        }
        for (let i = lengths.length - 1; i >= 0; i--) {
            const { nodeOffsetStart, nodeOffsetEnd } = lengths[i];
            if (lengthLessThan(nodeOffsetStart, position)) {
                const result = getFirstBracketBefore(node.children[i], nodeOffsetStart, nodeOffsetEnd, position);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }
    else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
        return null;
    }
    else if (node.kind === 1 /* AstNodeKind.Bracket */) {
        const range = lengthsToRange(nodeOffsetStart, nodeOffsetEnd);
        return {
            bracketInfo: node.bracketInfo,
            range
        };
    }
    return null;
}
function getFirstBracketAfter(node, nodeOffsetStart, nodeOffsetEnd, position) {
    if (node.kind === 4 /* AstNodeKind.List */ || node.kind === 2 /* AstNodeKind.Pair */) {
        for (const child of node.children) {
            nodeOffsetEnd = lengthAdd(nodeOffsetStart, child.length);
            if (lengthLessThan(position, nodeOffsetEnd)) {
                const result = getFirstBracketAfter(child, nodeOffsetStart, nodeOffsetEnd, position);
                if (result) {
                    return result;
                }
            }
            nodeOffsetStart = nodeOffsetEnd;
        }
        return null;
    }
    else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
        return null;
    }
    else if (node.kind === 1 /* AstNodeKind.Bracket */) {
        const range = lengthsToRange(nodeOffsetStart, nodeOffsetEnd);
        return {
            bracketInfo: node.bracketInfo,
            range
        };
    }
    return null;
}
function collectBrackets(node, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, result, level, levelPerBracketType) {
    if (level > 200) {
        return;
    }
    if (node.kind === 4 /* AstNodeKind.List */) {
        for (const child of node.children) {
            nodeOffsetEnd = lengthAdd(nodeOffsetStart, child.length);
            if (lengthLessThanEqual(nodeOffsetStart, endOffset) &&
                lengthGreaterThanEqual(nodeOffsetEnd, startOffset)) {
                collectBrackets(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, result, level, levelPerBracketType);
            }
            nodeOffsetStart = nodeOffsetEnd;
        }
    }
    else if (node.kind === 2 /* AstNodeKind.Pair */) {
        let levelPerBracket = 0;
        if (levelPerBracketType) {
            let existing = levelPerBracketType.get(node.openingBracket.text);
            if (existing === undefined) {
                existing = 0;
            }
            levelPerBracket = existing;
            existing++;
            levelPerBracketType.set(node.openingBracket.text, existing);
        }
        // Don't use node.children here to improve performance
        {
            const child = node.openingBracket;
            nodeOffsetEnd = lengthAdd(nodeOffsetStart, child.length);
            if (lengthLessThanEqual(nodeOffsetStart, endOffset) &&
                lengthGreaterThanEqual(nodeOffsetEnd, startOffset)) {
                const range = lengthsToRange(nodeOffsetStart, nodeOffsetEnd);
                result.push(new BracketInfo(range, level, levelPerBracket, !node.closingBracket));
            }
            nodeOffsetStart = nodeOffsetEnd;
        }
        if (node.child) {
            const child = node.child;
            nodeOffsetEnd = lengthAdd(nodeOffsetStart, child.length);
            if (lengthLessThanEqual(nodeOffsetStart, endOffset) &&
                lengthGreaterThanEqual(nodeOffsetEnd, startOffset)) {
                collectBrackets(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, result, level + 1, levelPerBracketType);
            }
            nodeOffsetStart = nodeOffsetEnd;
        }
        if (node.closingBracket) {
            const child = node.closingBracket;
            nodeOffsetEnd = lengthAdd(nodeOffsetStart, child.length);
            if (lengthLessThanEqual(nodeOffsetStart, endOffset) &&
                lengthGreaterThanEqual(nodeOffsetEnd, startOffset)) {
                const range = lengthsToRange(nodeOffsetStart, nodeOffsetEnd);
                result.push(new BracketInfo(range, level, levelPerBracket, false));
            }
            nodeOffsetStart = nodeOffsetEnd;
        }
        levelPerBracketType === null || levelPerBracketType === void 0 ? void 0 : levelPerBracketType.set(node.openingBracket.text, levelPerBracket);
    }
    else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
        const range = lengthsToRange(nodeOffsetStart, nodeOffsetEnd);
        result.push(new BracketInfo(range, level - 1, 0, true));
    }
    else if (node.kind === 1 /* AstNodeKind.Bracket */) {
        const range = lengthsToRange(nodeOffsetStart, nodeOffsetEnd);
        result.push(new BracketInfo(range, level - 1, 0, false));
    }
}
class CollectBracketPairsContext {
    constructor(result, includeMinIndentation, textModel) {
        this.result = result;
        this.includeMinIndentation = includeMinIndentation;
        this.textModel = textModel;
    }
}
function collectBracketPairs(node, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, context, level, levelPerBracketType) {
    var _a;
    if (level > 200) {
        return;
    }
    if (node.kind === 2 /* AstNodeKind.Pair */) {
        let levelPerBracket = 0;
        if (levelPerBracketType) {
            let existing = levelPerBracketType.get(node.openingBracket.text);
            if (existing === undefined) {
                existing = 0;
            }
            levelPerBracket = existing;
            existing++;
            levelPerBracketType.set(node.openingBracket.text, existing);
        }
        const openingBracketEnd = lengthAdd(nodeOffsetStart, node.openingBracket.length);
        let minIndentation = -1;
        if (context.includeMinIndentation) {
            minIndentation = node.computeMinIndentation(nodeOffsetStart, context.textModel);
        }
        context.result.push(new BracketPairWithMinIndentationInfo(lengthsToRange(nodeOffsetStart, nodeOffsetEnd), lengthsToRange(nodeOffsetStart, openingBracketEnd), node.closingBracket
            ? lengthsToRange(lengthAdd(openingBracketEnd, ((_a = node.child) === null || _a === void 0 ? void 0 : _a.length) || lengthZero), nodeOffsetEnd)
            : undefined, level, levelPerBracket, node, minIndentation));
        nodeOffsetStart = openingBracketEnd;
        if (node.child) {
            const child = node.child;
            nodeOffsetEnd = lengthAdd(nodeOffsetStart, child.length);
            if (lengthLessThanEqual(nodeOffsetStart, endOffset) &&
                lengthGreaterThanEqual(nodeOffsetEnd, startOffset)) {
                collectBracketPairs(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, context, level + 1, levelPerBracketType);
            }
        }
        levelPerBracketType === null || levelPerBracketType === void 0 ? void 0 : levelPerBracketType.set(node.openingBracket.text, levelPerBracket);
    }
    else {
        let curOffset = nodeOffsetStart;
        for (const child of node.children) {
            const childOffset = curOffset;
            curOffset = lengthAdd(curOffset, child.length);
            if (lengthLessThanEqual(childOffset, endOffset) &&
                lengthLessThanEqual(startOffset, curOffset)) {
                collectBracketPairs(child, childOffset, curOffset, startOffset, endOffset, context, level, levelPerBracketType);
            }
        }
    }
}
