import type { FC } from '../../../lib/teact/teact';
import {
  memo, useMemo,
  useState,
} from '../../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../../global';

import { SERVICE_NOTIFICATIONS_USER_ID } from '../../../config';
import {
  isDeletedUser, isUserBot,
} from '../../../global/helpers';
import { filterPeersByQuery } from '../../../global/helpers/peers';
import { unique } from '../../../util/iteratees';
import sortChatIds from '../../common/helpers/sortChatIds';

import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

import PeerPicker from '../../common/pickers/PeerPicker';
import PickerModal from '../../common/pickers/PickerModal';

import styles from './StarsGiftingPickerModal.module.scss';

export type OwnProps = {
  isOpen?: boolean;
};

interface StateProps {
  currentUserId?: string;
  userIds?: string[];
  activeListIds?: string[];
  archivedListIds?: string[];
}

const StarsGiftingPickerModal: FC<OwnProps & StateProps> = ({
  isOpen,
  currentUserId,
  activeListIds,
  archivedListIds,
  userIds,
}) => {
  const { closeStarsGiftingPickerModal, openStarsGiftModal } = getActions();

  const oldLang = useOldLang();

  const [searchQuery, setSearchQuery] = useState<string>('');

  const displayedUserIds = useMemo(() => {
    const usersById = getGlobal().users.byId;
    const durovId = Object.keys(usersById).find((id) => (
      usersById[id]?.usernames?.some((u) => u.isActive && u.username.toLowerCase() === 'durov')
    ));

    const combinedIds = unique([
      ...(currentUserId ? [currentUserId] : []),
      ...(durovId ? [durovId] : []),
      ...(userIds || []),
      ...(activeListIds || []),
      ...(archivedListIds || []),
    ]);

    const filteredUserIds = filterPeersByQuery({
      ids: combinedIds, query: searchQuery, type: 'user',
    });

    return sortChatIds(filteredUserIds.filter((id) => {
      const user = usersById[id];

      if (!user) {
        return false;
      }

      return !user.isSupport
        && !isUserBot(user) && !isDeletedUser(user)
        && id !== SERVICE_NOTIFICATIONS_USER_ID;
    })).sort((a, b) => {
      const userA = usersById[a];
      const userB = usersById[b];
      const usernameA = userA?.usernames?.find((u) => u.isActive)?.username?.toLowerCase();
      const usernameB = userB?.usernames?.find((u) => u.isActive)?.username?.toLowerCase();
      const scoreA = usernameA === 'durov' ? 0 : 1;
      const scoreB = usernameB === 'durov' ? 0 : 1;
      return scoreA - scoreB;
    });
  }, [currentUserId, searchQuery, userIds, activeListIds, archivedListIds]);

  const handleSelectedUserIdsChange = useLastCallback((newSelectedId?: string) => {
    if (newSelectedId?.length) {
      openStarsGiftModal({ forUserId: newSelectedId });
      closeStarsGiftingPickerModal();
    }
  });

  return (
    <PickerModal
      className={styles.root}
      isOpen={isOpen}
      onClose={closeStarsGiftingPickerModal}
      title={oldLang('GiftStarsTitle')}
      hasCloseButton
      shouldAdaptToSearch
      withFixedHeight
      confirmButtonText={oldLang('Continue')}
      onEnter={closeStarsGiftingPickerModal}
    >
      <PeerPicker
        className={styles.picker}
        itemIds={displayedUserIds}
        filterValue={searchQuery}
        filterPlaceholder={oldLang('Search')}
        onFilterChange={setSearchQuery}
        isSearchable
        withDefaultPadding
        withStatus
        onSelectedIdChange={handleSelectedUserIdsChange}
      />
    </PickerModal>
  );
};

export default memo(withGlobal<OwnProps>((global): Complete<StateProps> => {
  const {
    chats: {
      listIds,
    },
    currentUserId,
  } = global;

  return {
    userIds: global.contactList?.userIds,
    activeListIds: listIds.active,
    archivedListIds: listIds.archived,
    currentUserId,
  };
})(StarsGiftingPickerModal));
