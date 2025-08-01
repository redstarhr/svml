// common/utils/stateManager.js
const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');
const logger = require('@common/logger');
const deepmerge = require('deepmerge');

/**
 * 汎用的な状態管理クラス。
 * GCSからの読み書き、デフォルト値とのマージ、エラーハンドリングを共通化します。
 */
class StateManager {
  /**
   * @param {function(string): string} filePathTemplate ギルドIDを引数に取り、GCSのファイルパスを返す関数
   * @param {object} defaultState 機能ごとのデフォルト状態オブジェクト
   * @param {string} featureName ログ出力用の機能名
   */
  constructor(filePathTemplate, defaultState, featureName) {
    if (!filePathTemplate || typeof filePathTemplate !== 'function') {
      throw new Error('filePathTemplate (function) is required.');
    }
    if (!defaultState || typeof defaultState !== 'object') {
      throw new Error('defaultState (object) is required.');
    }
    if (!featureName || typeof featureName !== 'string') {
      throw new Error('featureName (string) is required for logging.');
    }

    this.filePathTemplate = filePathTemplate;
    this.defaultState = defaultState;
    this.loggerPrefix = `[${featureName}StateManager]`;
  }

  async readState(guildId) {
    try {
      const savedState = (await readJsonFromGCS(this.filePathTemplate(guildId))) || {};
      return deepmerge(this.defaultState, savedState);
    } catch (error) {
      if (error.code === 404) {
        logger.info(`${this.loggerPrefix} ギルド ${guildId} の状態ファイルが見つかりません。デフォルト状態を返します。`);
        return JSON.parse(JSON.stringify(this.defaultState));
      }
      logger.error(`${this.loggerPrefix} ギルド ${guildId} の状態読み込みに失敗しました。デフォルト状態を返します。`, { error });
      if (error.code === 'EAI_AGAIN' || (error.message && error.message.includes('getaddrinfo EAI_AGAIN'))) {
        logger.error(`${this.loggerPrefix} ヒント: DNS解決に失敗しました。ネットワーク接続またはDNS設定を確認してください。`);
      } else if (error.code === 403) {
        logger.error(`${this.loggerPrefix} ヒント: GCSへのアクセス権限がありません。サービスアカウントのIAM権限（例: ストレージオブジェクト閲覧者）を確認してください。`);
      }
      return JSON.parse(JSON.stringify(this.defaultState));
    }
  }

  async writeState(guildId, state) {
    await saveJsonToGCS(this.filePathTemplate(guildId), state);
  }

  async updateState(guildId, updateFn) {
    const currentState = await this.readState(guildId);
    const newState = updateFn(currentState);
    await this.writeState(guildId, newState);
  }
}
