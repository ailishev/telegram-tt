import type { FC } from '../../../lib/teact/teact';
import { memo, useEffect } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import { mapProfileIdToPeerId } from '../../../demo/supabaseClient';
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
    if (!isOpen) return;

    if (currentUserId) {
      openStarsGiftModal({ forUserId: currentUserId });
      closeStarsGiftingPickerModal();
      return;
    }

    void fetch('/api/profile/get-current', {
      method: 'GET',
      credentials: 'include',
    }).then((response) => (response.ok ? response.json() : undefined)).then((data) => {
      const profileId = data?.profile?.id as string | undefined;
      if (!profileId) return;
      openStarsGiftModal({ forUserId: mapProfileIdToPeerId(profileId) });
      closeStarsGiftingPickerModal();
    }).catch(() => undefined);
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
