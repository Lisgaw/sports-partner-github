import json

updates = {
  'tr': 'Kullanıcı adı',
  'en': 'Username',
  'de': 'Benutzername',
  'es': 'Nombre de usuario',
  'fr': "Nom d'utilisateur",
  'ja': 'ユーザー名',
  'ko': '사용자 이름',
  'ru': 'Имя пользователя',
}

for lang, value in updates.items():
    path = f'messages/{lang}.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data['profile']['editForm']['userHandle'] = value
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'Updated {path}')

print('Done')
