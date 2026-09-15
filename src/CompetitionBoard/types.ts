// Loosely typed on purpose � CompetitionBoard.tsx itself doesn't annotate
// these internally (comp, currentUser, etc. are plain objects passed
// straight through from App.tsx), so over-specifying here would just drift
// out of sync with the actual shapes in use.
export interface CompetitionBoardProps {
  comp?: any;
  onClose?: () => void;
  balance?: number;
  onSendGift?: (...args: any[]) => any;
  onOpenBuy?: () => void;
  onRegister?: (...args: any[]) => any;
  showToast?: (message: string, type?: string) => void;
  isRegistered?: boolean;
  isFollowed?: boolean;
  onToggleFollow?: (...args: any[]) => any;
  currentUser?: any;
  onRequestAuth?: () => void;
  onEditComp?: (...args: any[]) => any;
  onCreateComp?: (...args: any[]) => any;
  onAddImage?: (...args: any[]) => any;
  onRemoveImage?: (...args: any[]) => any;
  startInEditMode?: boolean;
  isNewEdition?: boolean;
  onParticipantRemoved?: (editionId: string) => void;
}
