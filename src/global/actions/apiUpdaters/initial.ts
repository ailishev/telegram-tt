import type {
  ApiUpdateAuthorizationError,
  ApiUpdateAuthorizationState,
  ApiUpdateConnectionState,
  ApiUpdateCurrentUser,
  ApiUpdatePasskeyOption,
  ApiUpdateServerTimeOffset,
  ApiUpdateSession,
  ApiUpdateUserAlreadyAuthorized,
} from '../../../api/types';
import { type LangCode } from '../../../types';
import type { RequiredGlobalActions } from '../../index';
import type { ActionReturnType, GlobalState } from '../../types';

import { getCurrentTabId } from '../../../util/establishMultitabRole';
import { isNumericPeerId } from '../../../util/entities/ids';
import { getShippingError, shouldClosePaymentModal } from '../../../util/getReadableErrorText';
import { unique } from '../../../util/iteratees';
import { getAccountsInfo, getAccountSlotUrl } from '../../../util/multiaccount';
import { oldSetLanguage } from '../../../util/oldLangProvider';
import { clearWebTokenAuth } from '../../../util/routing';
import { setServerTimeOffset } from '../../../util/serverTime';
import { updateSessionUserId } from '../../../util/sessions';
import { forceWebsync } from '../../../util/websync';
import { isChatChannel, isChatSuperGroup } from '../../helpers';
import {
  addActionHandler, getActions, getGlobal, setGlobal,
} from '../../index';
import { updateUser, updateUserFullInfo } from '../../reducers';
import { updateAuth } from '../../reducers/auth';
import { updateTabState } from '../../reducers/tabs';
import { selectCurrentMessageList, selectTabState } from '../../selectors';
import { selectSharedSettings } from '../../selectors/sharedState';

addActionHandler('apiUpdate', (global, actions, update): ActionReturnType => {
  switch (update['@type']) {
    case 'updateApiReady':
      onUpdateApiReady(global);
      break;

    case 'updateAuthorizationState':
      onUpdateAuthorizationState(global, actions, update);
      break;

    case 'updateAuthorizationError':
      onUpdateAuthorizationError(global, update);
      break;

    case 'updateUserAlreadyAuthorized':
      onUpdateUserAlreadyAuthorized(global, update);
      break;

    case 'updateWebAuthTokenFailed':
      onUpdateWebAuthTokenFailed(global);
      break;

    case 'updatePasskeyOption':
      onUpdatePasskeyOption(global, update);
      break;

    case 'updateConnectionState':
      onUpdateConnectionState(global, actions, update);
      break;

    case 'updateSession':
      onUpdateSession(global, actions, update);
      break;

    case 'updateServerTimeOffset':
      onUpdateServerTimeOffset(update);
      break;

    case 'updateCurrentUser':
      onUpdateCurrentUser(global, actions, update);
      break;

    case 'requestReconnectApi':
      global = { ...global, isSynced: false };
      setGlobal(global);

      onUpdateConnectionState(global, actions, {
        '@type': 'updateConnectionState',
        connectionState: 'connectionStateConnecting',
      });
      actions.initApi();
      break;

    case 'requestSync':
      actions.sync();
      break;

    case 'updateFetchingDifference':
      global = { ...global, isFetchingDifference: update.isFetching };
      setGlobal(global);
      break;

    case 'error': {
      Object.values(global.byTabId).forEach(({ id: tabId }) => {
        const paymentShippingError = getShippingError(update.error);
        if (paymentShippingError) {
          actions.addPaymentError({ error: paymentShippingError, tabId });
        } else if (shouldClosePaymentModal(update.error)) {
          actions.closePaymentModal({ tabId });
        } else if (actions.showDialog) {
          actions.showDialog({ data: update.error, tabId });
        }
      });

      break;
    }

    case 'notSupportedInFrozenAccount': {
      actions.showNotification({
        title: {
          key: 'NotificationTitleNotSupportedInFrozenAccount',
        },
        message: {
          key: 'NotificationMessageNotSupportedInFrozenAccount',
        },
        tabId: getCurrentTabId(),
      });
      break;
    }
  }
});

function onUpdateApiReady<T extends GlobalState>(global: T) {
  void oldSetLanguage(selectSharedSettings(global).language as LangCode);
}

function onUpdateAuthorizationState<T extends GlobalState>(
  global: T,
  actions: RequiredGlobalActions,
  update: ApiUpdateAuthorizationState,
) {
  const wasAuthReady = global.auth.state === 'authorizationStateReady';
  const authState = update.authorizationState;

  global = updateAuth(global, {
    state: authState,
    isLoading: false,
  });
  setGlobal(global);
  global = getGlobal();

  switch (authState) {
    case 'authorizationStateLoggingOut':
      void forceWebsync(false);

      global = updateAuth(global, {
        isLoggingOut: true,
      });
      setGlobal(global);
      break;
    case 'authorizationStateWaitCode':
      global = updateAuth(global, {
        isCodeViaApp: update.isCodeViaApp,
      });
      setGlobal(global);
      break;
    case 'authorizationStateWaitPassword':
      global = updateAuth(global, {
        hint: update.hint,
      });

      if (update.noReset) {
        global = updateAuth(global, {
          hasWebAuthTokenPasswordRequired: true,
        });
      }

      setGlobal(global);
      break;
    case 'authorizationStateWaitQrCode':
      global = updateAuth(global, {
        isLoadingQrCode: false,
        qrCode: update.qrCode,
      });
      setGlobal(global);
      break;
    case 'authorizationStateReady': {
      if (wasAuthReady) {
        break;
      }

      void forceWebsync(true);

      global = updateAuth(global, {
        isLoggingOut: false,
      });
      Object.values(global.byTabId).forEach(({ id: tabId }) => {
        global = updateTabState(global, {
          inactiveReason: undefined,
        }, tabId);
      });
      setGlobal(global);

      const currentUserId = getGlobal().currentUserId;
      if (currentUserId) {
        // eslint-disable-next-line no-console
        console.info('[telegram-link] linked account found', { currentUserId });
        openOwnProfileScreen(actions, currentUserId);
      } else {
        // eslint-disable-next-line no-console
        console.info('[telegram-link] linked account not found');
      }

      break;
    }
  }
}

function onUpdateAuthorizationError<T extends GlobalState>(global: T, update: ApiUpdateAuthorizationError) {
  if (update.errorCode === 'PASSKEY_CREDENTIAL_NOT_FOUND') {
    getActions().showNotification({
      message: update.errorKey,
      tabId: getCurrentTabId(),
    });
    return;
  }

  global = updateAuth(global, {
    errorKey: update.errorKey,
  });
  setGlobal(global);
}

function onUpdateUserAlreadyAuthorized<T extends GlobalState>(global: T, update: ApiUpdateUserAlreadyAuthorized) {
  const { userId } = update;
  if (global.currentUserId === userId) return;

  const accounts = getAccountsInfo();
  const slot = Object.entries(accounts).find(([_, info]) => info.userId === userId)?.[0];
  if (!slot) return;
  const url = getAccountSlotUrl(Number(slot));
  window.location.replace(url);
}

function onUpdateWebAuthTokenFailed<T extends GlobalState>(global: T) {
  clearWebTokenAuth();

  global = updateAuth(global, {
    hasWebAuthTokenFailed: true,
  });
  setGlobal(global);
}

function onUpdatePasskeyOption<T extends GlobalState>(global: T, update: ApiUpdatePasskeyOption) {
  global = updateAuth(global, {
    passkeyOption: update.option,
  });
  setGlobal(global);
}

function onUpdateConnectionState<T extends GlobalState>(
  global: T, actions: RequiredGlobalActions, update: ApiUpdateConnectionState,
) {
  const { connectionState } = update;

  const tabState = selectTabState(global, getCurrentTabId());
  if (connectionState === 'connectionStateReady' && tabState.isMasterTab && tabState.multitabNextAction) {
    // @ts-ignore
    actions[tabState.multitabNextAction.action](tabState.multitabNextAction.payload);
    actions.clearMultitabNextAction({ tabId: tabState.id });
  }

  if (connectionState === global.connectionState) {
    return;
  }

  global = {
    ...global,
    connectionState,
  };
  setGlobal(global);

  if (global.isSynced) {
    const channelStackIds = Object.values(global.byTabId)
      .flatMap((tab) => tab.messageLists)
      .map((messageList) => messageList.chatId)
      .filter((chatId) => {
        const chat = global.chats.byId[chatId];
        return chat && (isChatChannel(chat) || isChatSuperGroup(chat));
      });
    if (connectionState === 'connectionStateReady' && channelStackIds.length) {
      unique(channelStackIds).forEach((chatId) => {
        actions.requestChannelDifference({ chatId });
      });
    }
  }

  if (connectionState === 'connectionStateBroken') {
    const shouldForceInitApi = !global.currentUserId || isNumericPeerId(global.currentUserId);
    actions.signOut({ forceInitApi: shouldForceInitApi });
  }
}

function onUpdateSession<T extends GlobalState>(global: T, actions: RequiredGlobalActions, update: ApiUpdateSession) {
  const { sessionData } = update;
  const { rememberMe, state } = global.auth;
  const isEmpty = !sessionData || !sessionData.mainDcId;

  const isTest = sessionData?.isTest;
  if (isTest) {
    global = {
      ...global,
      config: {
        ...global.config,
        isTestServer: isTest,
      },
    };
    setGlobal(global);
  }

  if (!rememberMe || state !== 'authorizationStateReady' || isEmpty) {
    return;
  }

  actions.saveSession({ sessionData });
}

function onUpdateServerTimeOffset(update: ApiUpdateServerTimeOffset) {
  setServerTimeOffset(update.serverTimeOffset);
}

function onUpdateCurrentUser<T extends GlobalState>(
  global: T,
  actions: RequiredGlobalActions,
  update: ApiUpdateCurrentUser,
) {
  const { currentUser, currentUserFullInfo } = update;
  // eslint-disable-next-line no-console
  console.info('[store] profile state before', {
    currentUserId: global.currentUserId,
    hasCurrentUser: Boolean(global.currentUserId && global.users.byId[global.currentUserId]),
  });

  global = {
    ...updateUser(global, currentUser.id, currentUser),
    currentUserId: currentUser.id,
  };
  global = updateUserFullInfo(global, currentUser.id, currentUserFullInfo);
  setGlobal(global);
  // eslint-disable-next-line no-console
  console.info('[profile] backend current user/profile loaded', { currentUserId: currentUser.id });
  // eslint-disable-next-line no-console
  console.info('[profile] adapted user created', { currentUserId: currentUser.id });
  // eslint-disable-next-line no-console
  console.info('[store] profile state after', {
    currentUserId: global.currentUserId,
    hasCurrentUser: Boolean(global.currentUserId && global.users.byId[global.currentUserId]),
  });

  updateSessionUserId(currentUser.id);
  openOwnProfileScreen(actions, currentUser.id);
}

function openOwnProfileScreen(actions: RequiredGlobalActions, currentUserId: string) {
  const tabId = getCurrentTabId();
  const global = getGlobal();
  const currentMessageList = selectCurrentMessageList(global, tabId);
  const tabState = selectTabState(global, tabId);

  if (!isNumericPeerId(currentUserId)) {
    // eslint-disable-next-line no-console
    console.info('[profile] profile view skipped until self peer is adapted', { currentUserId });
    return;
  }

  const isCurrentUserProfileAlreadyOpen = currentMessageList?.chatId === currentUserId
    && tabState.chatInfo.isOpen
    && tabState.chatInfo.isOwnProfile;

  if (isCurrentUserProfileAlreadyOpen) {
    return;
  }

  actions.loadFullUser({ userId: currentUserId, withPhotos: true });
  actions.loadPeerSavedGifts({ peerId: currentUserId, shouldRefresh: true, tabId });
  actions.loadMyUniqueGifts({ shouldRefresh: true });
  actions.openChatWithInfo({
    id: currentUserId,
    isOwnProfile: true,
    shouldReplaceHistory: true,
    tabId,
  });
}
