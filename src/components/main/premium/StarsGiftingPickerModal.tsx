import type { FC } from '../../../lib/teact/teact';
import { memo, useEffect } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import useOldLang from '../../../hooks/useOldLang';

import PickerModal from '../../common/pickers/PickerModal';

import styles from './StarsGiftingPickerModal.module.scss';

export type OwnProps = {
  isOpen?: boolean;
};

interface StateProps {
  currentUserId?: string;
}

const StarsGiftingPickerModal: FC<OwnProps & StateProps> = ({
  isOpen,
  currentUserId,
}) => {
  const { closeStarsGiftingPickerModal, openStarsGiftModal } = getActions();
  const oldLang = useOldLang();

  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    openStarsGiftModal({ forUserId: currentUserId });
    closeStarsGiftingPickerModal();
  }, [isOpen, currentUserId]);

  return (
    <PickerModal
      className={styles.root}
      isOpen={isOpen}
      onClose={closeStarsGiftingPickerModal}
      title={oldLang('GiftStarsTitle')}
      hasCloseButton
      withFixedHeight
    >
      <div className={styles.center}>
        {oldLang('Loading')}
      </div>
    </PickerModal>
  );
};

export default memo(withGlobal<OwnProps>((global): Complete<StateProps> => {
  return {
    currentUserId: global.currentUserId,
  };
})(StarsGiftingPickerModal));
