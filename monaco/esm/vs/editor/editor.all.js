/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import './browser/coreCommands.js';
import './browser/widget/codeEditorWidget.js';
import './browser/widget/diffEditorWidget.js';
import './browser/widget/diffNavigator.js';
import './contrib/anchorSelect/browser/anchorSelect.js';
import './contrib/bracketMatching/browser/bracketMatching.js';
import './contrib/caretOperations/browser/caretOperations.js';
import './contrib/caretOperations/browser/transpose.js';
import './contrib/clipboard/browser/clipboard.js';
import './contrib/codeAction/browser/codeActionContributions.js';
import './contrib/codelens/browser/codelensController.js';
import './contrib/colorPicker/browser/colorContributions.js';
import './contrib/copyPaste/browser/copyPasteContribution.js';
import './contrib/comment/browser/comment.js';
import './contrib/contextmenu/browser/contextmenu.js';
import './contrib/cursorUndo/browser/cursorUndo.js';
import './contrib/dnd/browser/dnd.js';
import './contrib/dropIntoEditor/browser/dropIntoEditorContribution.js';
import './contrib/find/browser/findController.js';
import './contrib/folding/browser/folding.js';
import './contrib/fontZoom/browser/fontZoom.js';
import './contrib/format/browser/formatActions.js';
import './contrib/documentSymbols/browser/documentSymbols.js';
import './contrib/inlineCompletions/browser/ghostText.contribution.js';
import './contrib/gotoSymbol/browser/goToCommands.js';
import './contrib/gotoSymbol/browser/link/goToDefinitionAtPosition.js';
import './contrib/gotoError/browser/gotoError.js';
import './contrib/hover/browser/hover.js';
import './contrib/indentation/browser/indentation.js';
import './contrib/inlayHints/browser/inlayHintsContribution.js';
import './contrib/inPlaceReplace/browser/inPlaceReplace.js';
import './contrib/lineSelection/browser/lineSelection.js';
import './contrib/linesOperations/browser/linesOperations.js';
import './contrib/linkedEditing/browser/linkedEditing.js';
import './contrib/links/browser/links.js';
import './contrib/multicursor/browser/multicursor.js';
import './contrib/parameterHints/browser/parameterHints.js';
import './contrib/rename/browser/rename.js';
import './contrib/stickyScroll/browser/stickyScroll.js';
import './contrib/smartSelect/browser/smartSelect.js';
import './contrib/snippet/browser/snippetController2.js';
import './contrib/suggest/browser/suggestController.js';
import './contrib/suggest/browser/suggestInlineCompletions.js';
import './contrib/tokenization/browser/tokenization.js';
import './contrib/toggleTabFocusMode/browser/toggleTabFocusMode.js';
import './contrib/unicodeHighlighter/browser/unicodeHighlighter.js';
import './contrib/unusualLineTerminators/browser/unusualLineTerminators.js';
import './contrib/viewportSemanticTokens/browser/viewportSemanticTokens.js';
import './contrib/wordHighlighter/browser/wordHighlighter.js';
import './contrib/wordOperations/browser/wordOperations.js';
import './contrib/wordPartOperations/browser/wordPartOperations.js';
import './contrib/readOnlyMessage/browser/contribution.js';
// Load up these strings even in VSCode, even if they are not used
// in order to get them translated
import './common/standaloneStrings.js';
import '../base/browser/ui/codicons/codiconStyles.js'; // The codicons are defined here and must be loaded
