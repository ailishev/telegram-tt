import type { FC } from '../../../lib/teact/teact';
import {
  memo, useEffect, useMemo,
  useState,
} from '../../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../../global';

import { SERVICE_NOTIFICATIONS_USER_ID } from '../../../config';
import {
  isDeletedUser, isUserBot,
} from '../../../global/helpers';
import { filterPeersByQuery } from '../../../global/helpers/peers';
import { unique } from '../../../util/iteratees';
import { mapProfileIdToPeerId } from '../../../demo/supabaseClient';
import sortChatIds from '../../common/helpers/sortChatIds';

import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

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
  const { closeStarsGiftingPickerModal, openStarsGiftModal, loadCurrentUser } = getActions();

  const oldLang = useOldLang();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [backendUsers, setBackendUsers] = useState<Array<{ id: string; title: string; subtitle?: string }>>([]);

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

  useEffect(() => {
    if (!isOpen) return;
    loadCurrentUser();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (displayedUserIds.length > 0) return;

    void fetch('/api/search?q=', {
      method: 'GET',
      credentials: 'include',
    }).then((response) => (response.ok ? response.json() : undefined)).then((result) => {
      const users = (result?.users || []) as Array<{
        id: string;
        firstName?: string;
        lastName?: string;
        username?: string;
      }>;

      const fallbackUsers = users.slice(0, 20).map((user) => {
        const title = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User';
        const subtitle = user.username ? `@${user.username}` : undefined;
        return {
          id: mapProfileIdToPeerId(user.id),
          title,
          subtitle,
        };
      });

      setBackendUsers(fallbackUsers);
    }).catch(() => setBackendUsers([]));
  }, [isOpen, displayedUserIds]);

  const fallbackUsers = useMemo(() => {
    const usersById = getGlobal().users.byId;
    const localUsers = displayedUserIds.map((id) => {
      const user = usersById[id];
      const username = user?.usernames?.find((u) => u.isActive)?.username;
      const title = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || username || 'User';
      return {
        id,
        title,
        subtitle: username ? `@${username}` : undefined,
      };
    });

    const source = localUsers.length ? localUsers : backendUsers;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter((user) => (
      user.title.toLowerCase().includes(q) || user.subtitle?.toLowerCase().includes(q)
    ));
  }, [backendUsers, displayedUserIds, searchQuery]);

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
      <div className={styles.picker}>
        <input
          className={styles.search}
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          placeholder={oldLang('Search')}
        />
        {fallbackUsers.map((user) => (
          <button
            type="button"
            className={styles.fallbackItem}
            onClick={() => handleSelectedUserIdsChange(user.id)}
          >
            <div>{user.title}</div>
            {user.subtitle && <div className={styles.fallbackSubtitle}>{user.subtitle}</div>}
          </button>
        ))}
        {!fallbackUsers.length && (
          <button
            type="button"
            className={styles.fallbackItem}
            onClick={() => currentUserId && handleSelectedUserIdsChange(currentUserId)}
          >
            <div>My profile</div>
            {currentUserId && <div className={styles.fallbackSubtitle}>{currentUserId}</div>}
          </button>
        )}
      </div>
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
