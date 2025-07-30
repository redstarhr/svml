/svml設定　管理者権限のみ

パネル
embed
ユーザー情報登録　レベル設定　スタンプ登録　

ボタン：店舗名追加　ユーザー情報登録　レベル設定　スタンプ登録 売上報告店舗設定

店舗名追加ボタン→モーダル入力(star 改行　マンマミーア　で複数登録可能)→スレッドにログ作成(スレッド作成：店舗名　既存があればそこに記載　embed 入力者：　入力年月日時間：　追加/修正店舗名：)

ユーザー情報登録→モーダル入力(住所：　メール：　snsのアカウント名：　誕生日：　)→リスト選択店舗名→スレッドにログ作成(スレッド作成：ユーザー情報登録　既存があればそこに記載　embed 入力者：　入力年月日時間：　住所：　メール：　snsのアカウント名：　誕生日：)
レベル設定→今level_botフォルダに入ってるからconfig_botに移動

data-svml/<GUILD_ID>/<GUILD_ID>.json             // 店舗名
data-svml/<GUILD_ID>/level/config.json           // 経験値設定、ロール報酬
data-svml/<GUILD_ID>/level/users/<USER_ID>.json  // 各ユーザーのXP、レベル
data-svml/<GUILD_ID>/userinfo/<USER_ID>.json     // ユーザー個人情報（住所など）
data-svml/<GUILD_ID>/level/stamp.gif             // レベルアップGIF
