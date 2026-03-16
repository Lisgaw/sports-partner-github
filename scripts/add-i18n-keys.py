#!/usr/bin/env python3
"""
Adds new i18n keys to all 8 locale files.
Supports deep-merge so existing keys are preserved.
"""
import json, os, copy

BASE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "messages")

LOCALES = ["tr", "en", "de", "es", "fr", "ja", "ko", "ru"]

# ──────────────────────────────────────────────────────────────────────────────
# All new keys: top-level structure to DEEP-MERGE into each locale file.
# Each value is a dict keyed by locale code.
# ──────────────────────────────────────────────────────────────────────────────

NEW_KEYS = {
    "profile": {
        "header": {
            "editProfile":   {"tr":"Profili Düzenle","en":"Edit Profile","de":"Profil bearbeiten","es":"Editar perfil","fr":"Modifier le profil","ja":"プロフィール編集","ko":"프로필 편집","ru":"Редактировать профиль"},
            "followers":     {"tr":"takipçi","en":"followers","de":"Follower","es":"seguidores","fr":"abonnés","ja":"フォロワー","ko":"팔로워","ru":"подписчики"},
            "following":     {"tr":"takip","en":"following","de":"folgt","es":"siguiendo","fr":"abonnements","ja":"フォロー中","ko":"팔로잉","ru":"подписки"},
            "matches":       {"tr":"maç","en":"matches","de":"Spiele","es":"partidos","fr":"matchs","ja":"試合","ko":"경기","ru":"матчи"},
            "streak":        {"tr":"seri","en":"streak","de":"Serie","es":"racha","fr":"série","ja":"連続","ko":"연속","ru":"серия"},
            "age":           {"tr":"yaşında","en":"years old","de":"Jahre alt","es":"años","fr":"ans","ja":"歳","ko":"살","ru":"лет"},
            "uploadCover":   {"tr":"Kapak Değiştir","en":"Change Cover","de":"Cover ändern","es":"Cambiar portada","fr":"Changer la couverture","ja":"カバーを変更","ko":"커버 변경","ru":"Изменить обложку"},
            "uploading":     {"tr":"Yükleniyor...","en":"Uploading...","de":"Wird hochgeladen...","es":"Subiendo...","fr":"Téléchargement...","ja":"アップロード中...","ko":"업로드 중...","ru":"Загрузка..."},
            "change":        {"tr":"Değiştir","en":"Change","de":"Ändern","es":"Cambiar","fr":"Modifier","ja":"変更","ko":"변경","ru":"Изменить"},
            "coverUpdated":  {"tr":"Kapak fotoğrafı güncellendi","en":"Cover photo updated","de":"Titelbild aktualisiert","es":"Foto de portada actualizada","fr":"Photo de couverture mise à jour","ja":"カバー写真が更新されました","ko":"커버 사진이 업데이트되었습니다","ru":"Обложка обновлена"},
            "avatarUpdated": {"tr":"Profil fotoğrafı güncellendi","en":"Profile photo updated","de":"Profilbild aktualisiert","es":"Foto de perfil actualizada","fr":"Photo de profil mise à jour","ja":"プロフィール写真が更新されました","ko":"프로필 사진이 업데이트되었습니다","ru":"Фото профиля обновлено"},
            "uploadFailed":  {"tr":"Yüklenemedi","en":"Upload failed","de":"Upload fehlgeschlagen","es":"No se pudo subir","fr":"Échec du téléchargement","ja":"アップロードに失敗しました","ko":"업로드 실패","ru":"Не удалось загрузить"},
        },
        "stats": {
            "beginnerTier":  {"tr":"Başlangıç","en":"Beginner","de":"Anfänger","es":"Principiante","fr":"Débutant","ja":"初心者","ko":"초보자","ru":"Новичок"},
            "bronzeTier":    {"tr":"Bronz","en":"Bronze","de":"Bronze","es":"Bronce","fr":"Bronze","ja":"ブロンズ","ko":"브론즈","ru":"Бронза"},
            "silverTier":    {"tr":"Gümüş","en":"Silver","de":"Silber","es":"Plata","fr":"Argent","ja":"シルバー","ko":"실버","ru":"Серебро"},
            "goldTier":      {"tr":"Altın","en":"Gold","de":"Gold","es":"Oro","fr":"Or","ja":"ゴールド","ko":"골드","ru":"Золото"},
            "diamondTier":   {"tr":"Diamond","en":"Diamond","de":"Diamant","es":"Diamante","fr":"Diamant","ja":"ダイヤモンド","ko":"다이아몬드","ru":"Бриллиант"},
            "xpRemaining":   {"tr":"{count} kaldı","en":"{count} left","de":"Noch {count}","es":"{count} restantes","fr":"{count} restants","ja":"あと{count}","ko":"{count} 남음","ru":"осталось {count}"},
        },
        "streak": {
            "daySeries":     {"tr":"gün seri","en":"day streak","de":"Tage-Serie","es":"días de racha","fr":"jours de série","ja":"日連続","ko":"일 연속","ru":"дней подряд"},
            "record":        {"tr":"Rekor: {days} gün","en":"Record: {days} days","de":"Rekord: {days} Tage","es":"Récord: {days} días","fr":"Record: {days} jours","ja":"記録: {days}日","ko":"기록: {days}일","ru":"Рекорд: {days} дней"},
            "daysLeft":      {"tr":"{days} gün kaldı","en":"{days} days left","de":"Noch {days} Tage","es":"{days} días restantes","fr":"{days} jours restants","ja":"あと{days}日","ko":"{days}일 남음","ru":"осталось {days} дней"},
            "legendStreak":  {"tr":"🌋 Efsane seri! {days} gün kesintisiz","en":"🌋 Legendary streak! {days} days uninterrupted","de":"🌋 Legendäre Serie! {days} Tage ohne Unterbrechung","es":"🌋 ¡Racha legendaria! {days} días ininterrumpidos","fr":"🌋 Série légendaire! {days} jours ininterrompus","ja":"🌋 伝説の連続記録！{days}日間無中断","ko":"🌋 전설의 연속! {days}일 중단 없이","ru":"🌋 Легендарная серия! {days} дней без перерыва"},
        },
        "sports": {
            "morning":       {"tr":"🌅 Sabah","en":"🌅 Morning","de":"🌅 Morgens","es":"🌅 Mañana","fr":"🌅 Matin","ja":"🌅 朝","ko":"🌅 아침","ru":"🌅 Утро"},
            "evening":       {"tr":"🌙 Akşam","en":"🌙 Evening","de":"🌙 Abends","es":"🌙 Tarde","fr":"🌙 Soir","ja":"🌙 夜","ko":"🌙 저녁","ru":"🌙 Вечер"},
            "anytime":       {"tr":"⏰ Her Zaman","en":"⏰ Anytime","de":"⏰ Jederzeit","es":"⏰ Siempre","fr":"⏰ N'importe quand","ja":"⏰ いつでも","ko":"⏰ 언제든지","ru":"⏰ Когда угодно"},
            "competitive":   {"tr":"🏆 Rekabetçi","en":"🏆 Competitive","de":"🏆 Wettkampf","es":"🏆 Competitivo","fr":"🏆 Compétitif","ja":"🏆 競争","ko":"🏆 경쟁적","ru":"🏆 Соревновательный"},
            "casual":        {"tr":"😊 Eğlenceli","en":"😊 Casual","de":"😊 Entspannt","es":"😊 Casual","fr":"😊 Détendu","ja":"😊 カジュアル","ko":"😊 캐주얼","ru":"😊 Расслабленный"},
            "both":          {"tr":"⚡ Her İkisi","en":"⚡ Both","de":"⚡ Beides","es":"⚡ Ambos","fr":"⚡ Les deux","ja":"⚡ 両方","ko":"⚡ 둘 다","ru":"⚡ Оба"},
        },
        "completion": {
            "title":         {"tr":"Profil Tamamlanma","en":"Profile Completion","de":"Profilfertigstellung","es":"Completar perfil","fr":"Complétion du profil","ja":"プロフィール完成度","ko":"프로필 완성도","ru":"Заполнение профиля"},
            "nearlyDone":    {"tr":"Neredeyse tamam!","en":"Nearly done!","de":"Fast fertig!","es":"¡Casi listo!","fr":"Presque terminé!","ja":"もうすぐ完成！","ko":"거의 다 됐어요!","ru":"Почти готово!"},
            "doingWell":     {"tr":"İyi gidiyorsun!","en":"You're doing well!","de":"Du machst das gut!","es":"¡Vas bien!","fr":"Vous êtes en bonne voie!","ja":"良い調子です！","ko":"잘 하고 있어요!","ru":"Вы на правильном пути!"},
            "completeProfile":{"tr":"Profilini tamamla","en":"Complete your profile","de":"Vervollständige dein Profil","es":"Completa tu perfil","fr":"Complétez votre profil","ja":"プロフィールを完成させてください","ko":"프로필을 완성하세요","ru":"Заполните профиль"},
            "avatarLabel":   {"tr":"Profil Fotoğrafı","en":"Profile Photo","de":"Profilbild","es":"Foto de perfil","fr":"Photo de profil","ja":"プロフィール写真","ko":"프로필 사진","ru":"Фото профиля"},
            "avatarTip":     {"tr":"Fotoğraf ekle","en":"Add photo","de":"Foto hinzufügen","es":"Agregar foto","fr":"Ajouter une photo","ja":"写真を追加","ko":"사진 추가","ru":"Добавить фото"},
            "bioLabel":      {"tr":"Biyografi","en":"Biography","de":"Biografie","es":"Biografía","fr":"Biographie","ja":"自己紹介","ko":"자기소개","ru":"Биография"},
            "bioTip":        {"tr":"Hakkında yaz","en":"Write about yourself","de":"Über dich schreiben","es":"Escribe sobre ti","fr":"Écrivez sur vous","ja":"自己紹介を書く","ko":"자기소개 작성","ru":"Написать о себе"},
            "sportLabel":    {"tr":"Spor Seçimi","en":"Sport Selection","de":"Sportauswahl","es":"Selección de deporte","fr":"Sélection de sport","ja":"スポーツ選択","ko":"스포츠 선택","ru":"Выбор спорта"},
            "sportTip":      {"tr":"Spor dalı seç","en":"Choose sports","de":"Sport wählen","es":"Elige un deporte","fr":"Choisir un sport","ja":"スポーツを選ぶ","ko":"스포츠 선택","ru":"Выбрать спорт"},
            "cityLabel":     {"tr":"Şehir","en":"City","de":"Stadt","es":"Ciudad","fr":"Ville","ja":"都市","ko":"도시","ru":"Город"},
            "cityTip":       {"tr":"Şehir belirle","en":"Set city","de":"Stadt festlegen","es":"Establecer ciudad","fr":"Définir la ville","ja":"都市を設定","ko":"도시 설정","ru":"Указать город"},
            "phoneLabel":    {"tr":"Telefon","en":"Phone","de":"Telefon","es":"Teléfono","fr":"Téléphone","ja":"電話","ko":"전화","ru":"Телефон"},
            "phoneTip":      {"tr":"Telefon ekle","en":"Add phone","de":"Telefon hinzufügen","es":"Agregar teléfono","fr":"Ajouter un téléphone","ja":"電話を追加","ko":"전화 추가","ru":"Добавить телефон"},
            "birthDateLabel":{"tr":"Doğum Tarihi","en":"Date of Birth","de":"Geburtsdatum","es":"Fecha de nacimiento","fr":"Date de naissance","ja":"生年月日","ko":"생년월일","ru":"Дата рождения"},
            "birthDateTip":  {"tr":"Tarih gir","en":"Enter date","de":"Datum eingeben","es":"Ingresar fecha","fr":"Entrer la date","ja":"日付を入力","ko":"날짜 입력","ru":"Ввести дату"},
            "genderLabel":   {"tr":"Cinsiyet","en":"Gender","de":"Geschlecht","es":"Género","fr":"Genre","ja":"性別","ko":"성별","ru":"Пол"},
            "genderTip":     {"tr":"Cinsiyet seç","en":"Select gender","de":"Geschlecht wählen","es":"Seleccionar género","fr":"Sélectionner le genre","ja":"性別を選択","ko":"성별 선택","ru":"Выбрать пол"},
            "listingLabel":  {"tr":"İlk İlan","en":"First Listing","de":"Erste Anzeige","es":"Primera publicación","fr":"Première annonce","ja":"最初の広告","ko":"첫 광고","ru":"Первое объявление"},
            "listingTip":    {"tr":"İlan oluştur","en":"Create listing","de":"Anzeige erstellen","es":"Crear publicación","fr":"Créer une annonce","ja":"広告を作成","ko":"광고 만들기","ru":"Создать объявление"},
            "matchLabel":    {"tr":"İlk Maç","en":"First Match","de":"Erstes Spiel","es":"Primer partido","fr":"Premier match","ja":"初試合","ko":"첫 경기","ru":"Первый матч"},
            "matchTip":      {"tr":"Bir maç yap","en":"Play a match","de":"Spiel spielen","es":"Jugar un partido","fr":"Jouer un match","ja":"試合をする","ko":"경기 하기","ru":"Сыграть матч"},
        },
        "createPost": {
            "placeholder":    {"tr":"Ne düşünüyorsun? Paylaş...","en":"What's on your mind? Share...","de":"Was denkst du? Teile...","es":"¿Qué piensas? Comparte...","fr":"Qu'est-ce que vous pensez? Partagez...","ja":"何を考えていますか？シェア...","ko":"무슨 생각을 하고 있나요? 공유...","ru":"Что вы думаете? Поделитесь..."},
            "publish":        {"tr":"Paylaş","en":"Share","de":"Teilen","es":"Compartir","fr":"Partager","ja":"投稿","ko":"공유","ru":"Поделиться"},
            "published":      {"tr":"Gönderi paylaşıldı!","en":"Post shared!","de":"Beitrag geteilt!","es":"¡Publicación compartida!","fr":"Publication partagée!","ja":"投稿が共有されました！","ko":"게시물이 공유되었습니다!","ru":"Публикация добавлена!"},
            "createFailed":   {"tr":"Gönderi oluşturulamadı","en":"Could not create post","de":"Beitrag konnte nicht erstellt werden","es":"No se pudo crear la publicación","fr":"La publication n'a pas pu être créée","ja":"投稿を作成できませんでした","ko":"게시물을 만들 수 없었습니다","ru":"Не удалось создать публикацию"},
            "connectionError":{"tr":"Bağlantı hatası","en":"Connection error","de":"Verbindungsfehler","es":"Error de conexión","fr":"Erreur de connexion","ja":"接続エラー","ko":"연결 오류","ru":"Ошибка соединения"},
        },
        "editForm": {
            "title":           {"tr":"Profili Düzenle","en":"Edit Profile","de":"Profil bearbeiten","es":"Editar perfil","fr":"Modifier le profil","ja":"プロフィール編集","ko":"프로필 편집","ru":"Редактировать профиль"},
            "name":            {"tr":"Ad Soyad","en":"Full Name","de":"Vollständiger Name","es":"Nombre completo","fr":"Nom complet","ja":"フルネーム","ko":"성명","ru":"Полное имя"},
            "about":           {"tr":"Hakkımda","en":"About Me","de":"Über mich","es":"Sobre mí","fr":"À propos de moi","ja":"自己紹介","ko":"나에 대해","ru":"О себе"},
            "aboutPh":         {"tr":"Kendinizden bahsedin...","en":"Tell about yourself...","de":"Erzähle von dir...","es":"Cuéntanos sobre ti...","fr":"Parlez de vous...","ja":"自己紹介を書いてください...","ko":"자기소개를 적어주세요...","ru":"Расскажите о себе..."},
            "location":        {"tr":"Konum","en":"Location","de":"Ort","es":"Ubicación","fr":"Localisation","ja":"場所","ko":"위치","ru":"Местоположение"},
            "selectCountry":   {"tr":"Ülke Seçin...","en":"Select Country...","de":"Land auswählen...","es":"Seleccionar país...","fr":"Sélectionner un pays...","ja":"国を選択...","ko":"국가 선택...","ru":"Выберите страну..."},
            "selectCity":      {"tr":"Şehir Seçin...","en":"Select City...","de":"Stadt auswählen...","es":"Seleccionar ciudad...","fr":"Sélectionner une ville...","ja":"都市を選択...","ko":"도시 선택...","ru":"Выберите город..."},
            "selectDistrict":  {"tr":"İlçe Seçin...","en":"Select District...","de":"Bezirk auswählen...","es":"Seleccionar distrito...","fr":"Sélectionner un arrondissement...","ja":"地区を選択...","ko":"지역 선택...","ru":"Выберите район..."},
            "gender":          {"tr":"Cinsiyet","en":"Gender","de":"Geschlecht","es":"Género","fr":"Genre","ja":"性別","ko":"성별","ru":"Пол"},
            "genderUnspecified":{"tr":"Belirtilmemiş","en":"Unspecified","de":"Nicht angegeben","es":"No especificado","fr":"Non spécifié","ja":"未設定","ko":"미지정","ru":"Не указано"},
            "genderMale":      {"tr":"Erkek","en":"Male","de":"Männlich","es":"Masculino","fr":"Masculin","ja":"男性","ko":"남성","ru":"Мужской"},
            "genderFemale":    {"tr":"Kadın","en":"Female","de":"Weiblich","es":"Femenino","fr":"Féminin","ja":"女性","ko":"여성","ru":"Женский"},
            "genderPreferNot": {"tr":"Belirtmek İstemiyorum","en":"Prefer not to say","de":"Keine Angabe","es":"Prefiero no decirlo","fr":"Je préfère ne pas le dire","ja":"教えたくない","ko":"말하고 싶지 않음","ru":"Предпочитаю не говорить"},
            "birthDate":       {"tr":"Doğum Tarihi","en":"Date of Birth","de":"Geburtsdatum","es":"Fecha de nacimiento","fr":"Date de naissance","ja":"生年月日","ko":"생년월일","ru":"Дата рождения"},
            "mySports":        {"tr":"Sporlarım (max 5)","en":"My Sports (max 5)","de":"Meine Sportarten (max 5)","es":"Mis deportes (máx 5)","fr":"Mes sports (max 5)","ja":"私のスポーツ（最大5）","ko":"내 스포츠 (최대 5)","ru":"Мои виды спорта (макс. 5)"},
            "maxSportsError":  {"tr":"En fazla 5 spor seçebilirsiniz","en":"You can select up to 5 sports","de":"Du kannst bis zu 5 Sportarten wählen","es":"Puedes seleccionar hasta 5 deportes","fr":"Vous pouvez sélectionner jusqu'à 5 sports","ja":"最大5つのスポーツを選択できます","ko":"최대 5개의 스포츠를 선택할 수 있습니다","ru":"Вы можете выбрать до 5 видов спорта"},
            "phone":           {"tr":"Telefon","en":"Phone","de":"Telefon","es":"Teléfono","fr":"Téléphone","ja":"電話","ko":"전화","ru":"Телефон"},
            "currentPassword": {"tr":"Mevcut Şifre (değiştirmek için)","en":"Current Password (to change)","de":"Aktuelles Passwort (zum Ändern)","es":"Contraseña actual (para cambiar)","fr":"Mot de passe actuel (pour modifier)","ja":"現在のパスワード（変更する場合）","ko":"현재 비밀번호 (변경하려면)","ru":"Текущий пароль (для смены)"},
            "newPassword":     {"tr":"Yeni Şifre","en":"New Password","de":"Neues Passwort","es":"Nueva contraseña","fr":"Nouveau mot de passe","ja":"新しいパスワード","ko":"새 비밀번호","ru":"Новый пароль"},
            "newPasswordHint": {"tr":"Min 8 karakter, büyük/küçük harf, rakam, özel karakter","en":"Min 8 chars, uppercase/lowercase, number, special char","de":"Min 8 Zeichen, Groß/Kleinbuchstaben, Zahl, Sonderzeichen","es":"Mín 8 caracteres, mayúsculas/minúsculas, número, carácter especial","fr":"Min 8 caract., maj/min, nombre, caract. spécial","ja":"最低8文字、大文字/小文字、数字、特殊文字","ko":"최소 8자, 대/소문자, 숫자, 특수문자","ru":"Мин. 8 симв., букв. верх/нижн. регистр, цифра, спец. симв."},
            "socialMedia":     {"tr":"Sosyal Medya Hesapları","en":"Social Media Accounts","de":"Social-Media-Konten","es":"Cuentas de redes sociales","fr":"Comptes de réseaux sociaux","ja":"ソーシャルメディアアカウント","ko":"소셜 미디어 계정","ru":"Аккаунты в соцсетях"},
            "visibilityEveryone":{"tr":"Herkes","en":"Everyone","de":"Alle","es":"Todos","fr":"Tout le monde","ja":"全員","ko":"모두","ru":"Все"},
            "visibilityFriends": {"tr":"Arkadaşlarım","en":"My Friends","de":"Meine Freunde","es":"Mis amigos","fr":"Mes amis","ja":"フォロワー","ko":"친구들","ru":"Мои друзья"},
            "visibilityNobody":  {"tr":"Hiçkimse","en":"Nobody","de":"Niemand","es":"Nadie","fr":"Personne","ja":"誰でもない","ko":"아무도","ru":"Никто"},
            "trainerSection":  {"tr":"Antrenör Profili","en":"Trainer Profile","de":"Trainerprofil","es":"Perfil de entrenador","fr":"Profil d'entraîneur","ja":"トレーナープロフィール","ko":"트레이너 프로필","ru":"Профиль тренера"},
            "lessonTypes":     {"tr":"Ders türleri","en":"Lesson types","de":"Unterrichtsarten","es":"Tipos de lecciones","fr":"Types de cours","ja":"レッスンの種類","ko":"수업 유형","ru":"Виды уроков"},
            "addBranch":       {"tr":"+ Branş ekle","en":"+ Add Branch","de":"+ Zweig hinzufügen","es":"+ Agregar rama","fr":"+ Ajouter une branche","ja":"+ 専門分野を追加","ko":"+ 전문 분야 추가","ru":"+ Добавить ответвление"},
            "deleteBranch":    {"tr":"Sil","en":"Delete","de":"Löschen","es":"Eliminar","fr":"Supprimer","ja":"削除","ko":"삭제","ru":"Удалить"},
            "save":            {"tr":"Kaydet","en":"Save","de":"Speichern","es":"Guardar","fr":"Enregistrer","ja":"保存","ko":"저장","ru":"Сохранить"},
            "cancel":          {"tr":"Vazgeç","en":"Cancel","de":"Abbrechen","es":"Cancelar","fr":"Annuler","ja":"キャンセル","ko":"취소","ru":"Отмена"},
            "equipmentUnspecified":{"tr":"Ekipman sağlama: Belirtilmemiş","en":"Equipment: Not specified","de":"Ausrüstung: Nicht angegeben","es":"Equipo: No especificado","fr":"Équipement: Non spécifié","ja":"用具提供：未指定","ko":"장비 제공: 미지정","ru":"Снаряжение: Не указано"},
            "equipmentYes":    {"tr":"Ekipman sağlıyorum","en":"I provide equipment","de":"Ich stelle Ausrüstung bereit","es":"Proporciono equipamiento","fr":"Je fournis du matériel","ja":"用具を提供します","ko":"장비를 제공합니다","ru":"Я предоставляю снаряжение"},
            "equipmentNo":     {"tr":"Ekipman sağlamıyorum","en":"I don't provide equipment","de":"Ich stelle keine Ausrüstung bereit","es":"No proporciono equipamiento","fr":"Je ne fournis pas de matériel","ja":"用具を提供しません","ko":"장비를 제공하지 않습니다","ru":"Я не предоставляю снаряжение"},
            "certNote":        {"tr":"Sertifika notu","en":"Certificate note","de":"Zertifikatnotiz","es":"Nota del certificado","fr":"Note de certificat","ja":"資格メモ","ko":"자격증 메모","ru":"Примечание о сертификате"},
            "branchName":      {"tr":"Branş adı","en":"Branch name","de":"Name des Zweigs","es":"Nombre de la rama","fr":"Nom de la branche","ja":"専門分野名","ko":"전문 분야명","ru":"Название ответвления"},
            "branchExperience":{"tr":"Branş deneyimi (yıl)","en":"Branch experience (years)","de":"Zweig-Erfahrung (Jahre)","es":"Experiencia en la rama (años)","fr":"Expérience dans la branche (années)","ja":"専門分野の経験（年）","ko":"전문 분야 경력 (년)","ru":"Опыт в ответвлении (лет)"},
        },
    },
    "settings": {
        "editProfileDesc":   {"tr":"Ad, biyografi, konum, fotoğraf","en":"Name, bio, location, photo","de":"Name, Bio, Ort, Foto","es":"Nombre, bio, ubicación, foto","fr":"Nom, bio, lieu, photo","ja":"名前、プロフィール、場所、写真","ko":"이름, 소개, 위치, 사진","ru":"Имя, биография, местоположение, фото"},
        "securityDesc":      {"tr":"Şifre ve e-posta değiştir","en":"Change password and email","de":"Passwort und E-Mail ändern","es":"Cambiar contraseña y correo electrónico","fr":"Changer le mot de passe et l'email","ja":"パスワードとメールを変更","ko":"비밀번호 및 이메일 변경","ru":"Изменить пароль и email"},
        "professionalDesc":  {"tr":"Antrenör başvurusu ve onay durumu","en":"Trainer application and approval status","de":"Trainer-Bewerbung und Genehmigungsstatus","es":"Solicitud de entrenador y estado de aprobación","fr":"Candidature d'entraîneur et statut d'approbation","ja":"トレーナー申請と承認状況","ko":"트레이너 신청 및 승인 상태","ru":"Заявка на тренера и статус одобрения"},
        "privacyDesc":       {"tr":"Hesap görünürlüğü, engellenenler","en":"Visibility and blocked users","de":"Kontoansicht, gesperrte Benutzer","es":"Visibilidad de la cuenta, usuarios bloqueados","fr":"Visibilité du compte, utilisateurs bloqués","ja":"アカウントの表示、ブロックされたユーザー","ko":"계정 공개 여부, 차단된 사용자","ru":"Видимость аккаунта, заблокированные пользователи"},
        "notificationsDesc": {"tr":"Push bildirim tercihleri","en":"Push notification preferences","de":"Push-Benachrichtigungseinstellungen","es":"Preferencias de notificaciones push","fr":"Préférences de notifications push","ja":"プッシュ通知設定","ko":"푸시 알림 설정","ru":"Настройки push-уведомлений"},
        "invite":            {"tr":"Arkadaşını Davet Et","en":"Invite Friends","de":"Freunde einladen","es":"Invitar amigos","fr":"Inviter des amis","ja":"友達を招待","ko":"친구 초대","ru":"Пригласить друзей"},
        "inviteDesc":        {"tr":"Davet kodu ile arkadaşını getir","en":"Invite your friends with your code","de":"Lade deine Freunde mit deinem Code ein","es":"Invita a tus amigos con tu código","fr":"Invitez vos amis avec votre code","ja":"コードで友達を招待","ko":"코드로 친구 초대","ru":"Пригласите друзей с помощью кода"},
        "quickTitle":        {"tr":"Hızlı Ayarlar","en":"Quick Settings","de":"Schnelleinstellungen","es":"Configuración rápida","fr":"Paramètres rapides","ja":"クイック設定","ko":"빠른 설정","ru":"Быстрые настройки"},
        "quickDesc":         {"tr":"Dil ve hesap bölümlerine mobilde daha rahat eriş.","en":"Quick mobile access to language and account sections.","de":"Schneller mobiler Zugriff auf Sprach- und Kontoabschnitte.","es":"Acceso rápido móvil a secciones de idioma y cuenta.","fr":"Accès mobile rapide aux sections langue et compte.","ja":"言語とアカウントセクションへのクイックモバイルアクセス。","ko":"언어 및 계정 섹션에 빠른 모바일 접근.","ru":"Быстрый мобильный доступ к разделам языка и аккаунта."},
        "backToProfile":     {"tr":"← Profilime Dön","en":"← Back to Profile","de":"← Zurück zum Profil","es":"← Volver al perfil","fr":"← Retour au profil","ja":"← プロフィールに戻る","ko":"← 프로필로 돌아가기","ru":"← Назад к профилю"},
        "securityPage": {
            "title":             {"tr":"Şifre Değiştir","en":"Change Password","de":"Passwort ändern","es":"Cambiar contraseña","fr":"Changer le mot de passe","ja":"パスワード変更","ko":"비밀번호 변경","ru":"Смена пароля"},
            "subtitle":          {"tr":"Güçlü bir şifre hesabını korur.","en":"A strong password protects your account.","de":"Ein starkes Passwort schützt dein Konto.","es":"Una contraseña segura protege tu cuenta.","fr":"Un mot de passe fort protège votre compte.","ja":"強いパスワードはアカウントを守ります。","ko":"강력한 비밀번호는 계정을 보호합니다.","ru":"Надёжный пароль защищает ваш аккаунт."},
            "currentPassword":   {"tr":"Mevcut Şifre","en":"Current Password","de":"Aktuelles Passwort","es":"Contraseña actual","fr":"Mot de passe actuel","ja":"現在のパスワード","ko":"현재 비밀번호","ru":"Текущий пароль"},
            "currentPasswordPh": {"tr":"Mevcut şifreniz","en":"Your current password","de":"Ihr aktuelles Passwort","es":"Tu contraseña actual","fr":"Votre mot de passe actuel","ja":"現在のパスワード","ko":"현재 비밀번호","ru":"Ваш текущий пароль"},
            "newPassword":       {"tr":"Yeni Şifre","en":"New Password","de":"Neues Passwort","es":"Nueva contraseña","fr":"Nouveau mot de passe","ja":"新しいパスワード","ko":"새 비밀번호","ru":"Новый пароль"},
            "newPasswordPh":     {"tr":"Yeni şifreniz","en":"Your new password","de":"Ihr neues Passwort","es":"Tu nueva contraseña","fr":"Votre nouveau mot de passe","ja":"新しいパスワード","ko":"새 비밀번호","ru":"Ваш новый пароль"},
            "newPasswordRepeat": {"tr":"Yeni Şifre Tekrar","en":"Repeat New Password","de":"Neues Passwort wiederholen","es":"Repetir nueva contraseña","fr":"Répéter le nouveau mot de passe","ja":"新しいパスワードの確認","ko":"새 비밀번호 확인","ru":"Повтор нового пароля"},
            "newPasswordRepeatPh":{"tr":"Yeni şifrenizi tekrar giriniz","en":"Enter your new password again","de":"Neues Passwort erneut eingeben","es":"Ingresa tu nueva contraseña de nuevo","fr":"Saisir à nouveau le nouveau mot de passe","ja":"新しいパスワードをもう一度入力","ko":"새 비밀번호를 다시 입력","ru":"Введите новый пароль ещё раз"},
            "submit":            {"tr":"Şifremi Değiştir","en":"Change My Password","de":"Mein Passwort ändern","es":"Cambiar mi contraseña","fr":"Changer mon mot de passe","ja":"パスワードを変更する","ko":"비밀번호 변경하기","ru":"Изменить пароль"},
            "show":              {"tr":"Göster","en":"Show","de":"Anzeigen","es":"Mostrar","fr":"Afficher","ja":"表示","ko":"보기","ru":"Показать"},
            "hide":              {"tr":"Gizle","en":"Hide","de":"Ausblenden","es":"Ocultar","fr":"Masquer","ja":"非表示","ko":"숨기기","ru":"Скрыть"},
            "ruleMin":           {"tr":"En az 8 karakter","en":"At least 8 characters","de":"Mindestens 8 Zeichen","es":"Al menos 8 caracteres","fr":"Au moins 8 caractères","ja":"8文字以上","ko":"최소 8자","ru":"Минимум 8 символов"},
            "ruleUpper":         {"tr":"Büyük harf","en":"Uppercase letter","de":"Großbuchstabe","es":"Letra mayúscula","fr":"Lettre majuscule","ja":"大文字","ko":"대문자","ru":"Заглавная буква"},
            "ruleLower":         {"tr":"Küçük harf","en":"Lowercase letter","de":"Kleinbuchstabe","es":"Letra minúscula","fr":"Lettre minuscule","ja":"小文字","ko":"소문자","ru":"Строчная буква"},
            "ruleNumber":        {"tr":"Rakam","en":"Number","de":"Zahl","es":"Número","fr":"Chiffre","ja":"数字","ko":"숫자","ru":"Цифра"},
            "ruleSpecial":       {"tr":"Özel karakter","en":"Special character","de":"Sonderzeichen","es":"Carácter especial","fr":"Caractère spécial","ja":"特殊文字","ko":"특수문자","ru":"Специальный символ"},
            "changed":           {"tr":"Şifre başarıyla değiştirildi ✓","en":"Password changed successfully ✓","de":"Passwort erfolgreich geändert ✓","es":"Contraseña cambiada exitosamente ✓","fr":"Mot de passe modifié avec succès ✓","ja":"パスワードが正常に変更されました ✓","ko":"비밀번호가 성공적으로 변경되었습니다 ✓","ru":"Пароль успешно изменён ✓"},
            "changeFailed":      {"tr":"Şifre değiştirilemedi","en":"Password could not be changed","de":"Passwort konnte nicht geändert werden","es":"No se pudo cambiar la contraseña","fr":"Impossible de changer le mot de passe","ja":"パスワードを変更できませんでした","ko":"비밀번호를 변경할 수 없었습니다","ru":"Не удалось изменить пароль"},
            "dangerTitle":       {"tr":"Tehlikeli Bölge","en":"Danger Zone","de":"Gefahrenzone","es":"Zona de peligro","fr":"Zone de danger","ja":"危険エリア","ko":"위험 구역","ru":"Зона опасности"},
            "dangerDesc":        {"tr":"Hesabını kalıcı olarak silmek istersen aşağıdaki butonu kullan. Bu işlem geri alınamaz; tüm verileriniz silinecektir.","en":"Use the button below to permanently delete your account. This action cannot be undone and all your data will be removed.","de":"Verwende die Schaltfläche unten, um dein Konto dauerhaft zu löschen. Diese Aktion kann nicht rückgängig gemacht werden.","es":"Usa el botón de abajo para eliminar permanentemente tu cuenta. Esta acción no se puede deshacer.","fr":"Utilisez le bouton ci-dessous pour supprimer définitivement votre compte. Cette action est irréversible.","ja":"以下のボタンを使用してアカウントを永久に削除してください。この操作は元に戻せません。","ko":"아래 버튼을 사용하여 계정을 영구적으로 삭제하세요. 이 작업은 되돌릴 수 없습니다.","ru":"Используйте кнопку ниже, чтобы навсегда удалить аккаунт. Это действие нельзя отменить."},
            "deleteAccount":     {"tr":"Hesabımı Sil","en":"Delete My Account","de":"Mein Konto löschen","es":"Eliminar mi cuenta","fr":"Supprimer mon compte","ja":"アカウントを削除","ko":"계정 삭제","ru":"Удалить мой аккаунт"},
            "confirmPasswordPrompt":{"tr":"Onaylamak için şifrenizi giriniz:","en":"Enter your password to confirm:","de":"Passwort zur Bestätigung eingeben:","es":"Ingresa tu contraseña para confirmar:","fr":"Entrez votre mot de passe pour confirmer:","ja":"確認のためパスワードを入力してください:","ko":"확인을 위해 비밀번호를 입력하세요:","ru":"Введите пароль для подтверждения:"},
            "deletedSuccess":    {"tr":"Hesabınız silindi. Hoşça kalın.","en":"Your account has been deleted.","de":"Ihr Konto wurde gelöscht.","es":"Tu cuenta ha sido eliminada.","fr":"Votre compte a été supprimé.","ja":"アカウントが削除されました。","ko":"계정이 삭제되었습니다.","ru":"Ваш аккаунт удалён."},
            "deleteFailed":      {"tr":"Hesap silinemedi","en":"Account could not be deleted","de":"Konto konnte nicht gelöscht werden","es":"No se pudo eliminar la cuenta","fr":"Impossible de supprimer le compte","ja":"アカウントを削除できませんでした","ko":"계정을 삭제할 수 없었습니다","ru":"Не удалось удалить аккаунт"},
            "deleting":          {"tr":"Siliniyor...","en":"Deleting...","de":"Wird gelöscht...","es":"Eliminando...","fr":"Suppression en cours...","ja":"削除中...","ko":"삭제 중...","ru":"Удаление..."},
            "deleteConfirm":     {"tr":"Evet, Hesabımı Sil","en":"Yes, Delete My Account","de":"Ja, mein Konto löschen","es":"Sí, eliminar mi cuenta","fr":"Oui, supprimer mon compte","ja":"はい、アカウントを削除します","ko":"예, 계정 삭제","ru":"Да, удалить мой аккаунт"},
            "cancel":            {"tr":"Vazgeç","en":"Cancel","de":"Abbrechen","es":"Cancelar","fr":"Annuler","ja":"キャンセル","ko":"취소","ru":"Отмена"},
            "enterCurrentPassword":{"tr":"Mevcut şifrenizi giriniz","en":"Please enter your current password","de":"Bitte geben Sie Ihr aktuelles Passwort ein","es":"Por favor ingrese su contraseña actual","fr":"Veuillez entrer votre mot de passe actuel","ja":"現在のパスワードを入力してください","ko":"현재 비밀번호를 입력해주세요","ru":"Введите текущий пароль"},
            "minLength":         {"tr":"Yeni şifre en az 8 karakter olmalı","en":"New password must be at least 8 characters","de":"Neues Passwort muss mindestens 8 Zeichen enthalten","es":"La nueva contraseña debe tener al menos 8 caracteres","fr":"Le nouveau mot de passe doit comporter au moins 8 caractères","ja":"新しいパスワードは最低8文字必要です","ko":"새 비밀번호는 최소 8자여야 합니다","ru":"Новый пароль должен содержать минимум 8 символов"},
            "requireUpper":      {"tr":"Yeni şifre büyük harf içermeli","en":"New password must include an uppercase letter","de":"Neues Passwort muss einen Großbuchstaben enthalten","es":"La nueva contraseña debe incluir una letra mayúscula","fr":"Le nouveau mot de passe doit inclure une lettre majuscule","ja":"新しいパスワードは大文字を含む必要があります","ko":"새 비밀번호에는 대문자가 포함되어야 합니다","ru":"Новый пароль должен содержать заглавную букву"},
            "requireNumber":     {"tr":"Yeni şifre rakam içermeli","en":"New password must include a number","de":"Neues Passwort muss eine Zahl enthalten","es":"La nueva contraseña debe incluir un número","fr":"Le nouveau mot de passe doit inclure un chiffre","ja":"新しいパスワードには数字を含む必要があります","ko":"새 비밀번호에는 숫자가 포함되어야 합니다","ru":"Новый пароль должен содержать цифру"},
            "requireSpecial":    {"tr":"Yeni şifre özel karakter içermeli","en":"New password must include a special character","de":"Neues Passwort muss ein Sonderzeichen enthalten","es":"La nueva contraseña debe incluir un carácter especial","fr":"Le nouveau mot de passe doit inclure un caractère spécial","ja":"新しいパスワードには特殊文字を含む必要があります","ko":"새 비밀번호에는 특수문자가 포함되어야 합니다","ru":"Новый пароль должен содержать специальный символ"},
            "mismatch":          {"tr":"Şifreler eşleşmiyor","en":"Passwords do not match","de":"Passwörter stimmen nicht überein","es":"Las contraseñas no coinciden","fr":"Les mots de passe ne correspondent pas","ja":"パスワードが一致しません","ko":"비밀번호가 일치하지 않습니다","ru":"Пароли не совпадают"},
            "genericError":      {"tr":"Bir hata oluştu","en":"An error occurred","de":"Ein Fehler ist aufgetreten","es":"Ocurrió un error","fr":"Une erreur est survenue","ja":"エラーが発生しました","ko":"오류가 발생했습니다","ru":"Произошла ошибка"},
        },
        "privacyPage": {
            "title":                {"tr":"Gizlilik & Güvenlik","en":"Privacy & Security","de":"Datenschutz & Sicherheit","es":"Privacidad y seguridad","fr":"Confidentialité et sécurité","ja":"プライバシーとセキュリティ","ko":"개인정보 및 보안","ru":"Конфиденциальность и безопасность"},
            "subtitle":             {"tr":"Sana kim mesaj yazabilir, kim teklif gönderebilir ve profilini kimler görebilir — hepsini kontrol et.","en":"Control who can message you, challenge you, and view your profile.","de":"Kontrolliere, wer dir Nachrichten schicken, dich herausfordern und dein Profil sehen kann.","es":"Controla quién puede enviarte mensajes, desafiarte y ver tu perfil.","fr":"Contrôlez qui peut vous envoyer des messages, vous défier et voir votre profil.","ja":"メッセージを送れる人、チャレンジできる人、プロフィールを見れる人を管理してください。","ko":"메시지를 보낼 수 있는 사람, 도전할 수 있는 사람, 프로필을 볼 수 있는 사람을 관리하세요.","ru":"Управляйте тем, кто может писать вам сообщения, бросать вызовы и просматривать профиль."},
            "accessControls":       {"tr":"Erişim Kontrolleri","en":"Access Controls","de":"Zugriffskontrollen","es":"Controles de acceso","fr":"Contrôles d'accès","ja":"アクセス制御","ko":"접근 제어","ru":"Контроль доступа"},
            "whoCanMessage":        {"tr":"Bana Kim Mesaj Yazabilir?","en":"Who Can Message Me?","de":"Wer kann mir Nachrichten senden?","es":"¿Quién puede enviarme mensajes?","fr":"Qui peut m'envoyer des messages?","ja":"誰がメッセージを送れますか？","ko":"누가 메시지를 보낼 수 있나요?","ru":"Кто может писать мне сообщения?"},
            "whoCanMessageDesc":    {"tr":"Yeni direkt mesaj konuşması başlatabilecek kişileri belirle","en":"Determine who can start a new direct message conversation","de":"Bestimme, wer eine neue Direktnachricht starten kann","es":"Determina quién puede iniciar una nueva conversación directa","fr":"Déterminez qui peut démarrer une nouvelle conversation par message direct","ja":"新しいダイレクトメッセージ会話を開始できる人を決めてください","ko":"새 다이렉트 메시지 대화를 시작할 수 있는 사람을 결정하세요","ru":"Определите, кто может начать новый разговор в личных сообщениях"},
            "whoCanChallenge":      {"tr":"Bana Kim Teklif Gönderebilir?","en":"Who Can Challenge Me?","de":"Wer kann mich herausfordern?","es":"¿Quién puede desafiarme?","fr":"Qui peut me défier?","ja":"誰がチャレンジを送れますか？","ko":"누가 도전을 보낼 수 있나요?","ru":"Кто может бросать мне вызовы?"},
            "whoCanChallengeDesc":  {"tr":"Maç veya partner teklifi gönderebilecek kişileri belirle","en":"Determine who can send match or partner challenges","de":"Bestimme, wer Spiel- oder Partner-Challenges senden kann","es":"Determina quién puede enviar desafíos de partido o pareja","fr":"Déterminez qui peut envoyer des défis de match ou de partenaire","ja":"試合またはパートナーのチャレンジを送れる人を決めてください","ko":"경기 또는 파트너 도전을 보낼 수 있는 사람을 결정하세요","ru":"Определите, кто может отправлять вызовы на матч или партнёрство"},
            "profileVisibility":    {"tr":"Profilimi Kimler Görebilir?","en":"Who Can View My Profile?","de":"Wer kann mein Profil sehen?","es":"¿Quién puede ver mi perfil?","fr":"Qui peut voir mon profil?","ja":"誰がプロフィールを見れますか？","ko":"누가 내 프로필을 볼 수 있나요?","ru":"Кто может просматривать мой профиль?"},
            "profileVisibilityDesc":{"tr":"Profil sayfana kimlerin erişebileceğini belirle","en":"Determine who can access your profile page","de":"Bestimme, wer auf deine Profilseite zugreifen kann","es":"Determina quién puede acceder a tu página de perfil","fr":"Déterminez qui peut accéder à votre page de profil","ja":"プロフィールページにアクセスできる人を決めてください","ko":"프로필 페이지에 접근할 수 있는 사람을 결정하세요","ru":"Определите, кто может получить доступ к вашей странице профиля"},
            "socialLinksVisibility":{"tr":"Sosyal Medya Linklerimi Kimler Görebilir?","en":"Who Can See My Social Links?","de":"Wer kann meine Social Links sehen?","es":"¿Quién puede ver mis redes sociales?","fr":"Qui peut voir mes liens sociaux?","ja":"誰がソーシャルリンクを見れますか？","ko":"누가 소셜 링크를 볼 수 있나요?","ru":"Кто может видеть мои социальные ссылки?"},
            "socialLinksVisibilityDesc":{"tr":"Sosyal medya bağlantılarını kimlerin göreceğini belirle","en":"Determine who sees your social media links","de":"Bestimme, wer deine Social-Media-Links sieht","es":"Determina quién ve tus enlaces de redes sociales","fr":"Déterminez qui voit vos liens de réseaux sociaux","ja":"ソーシャルメディアリンクを誰が見るかを決めてください","ko":"소셜 미디어 링크를 볼 사람을 결정하세요","ru":"Определите, кто видит ваши ссылки в соцсетях"},
            "privateProfile":       {"tr":"Kapalı Profil","en":"Private Profile","de":"Privates Profil","es":"Perfil privado","fr":"Profil privé","ja":"プライベートプロフィール","ko":"비공개 프로필","ru":"Закрытый профиль"},
            "privateProfileDesc":   {"tr":"Açıksa, seni takip etmek isteyenler onay bekler. Sadece onayladıkların takipçin olur.","en":"When on, followers must await approval. Only those you approve can follow you.","de":"Wenn aktiviert, müssen Follower auf Genehmigung warten. Nur wer du genehmigst, kann dir folgen.","es":"Cuando está activo, los seguidores deben esperar aprobación. Solo quienes apruebes podrán seguirte.","fr":"Lorsqu'il est activé, les abonnés doivent attendre l'approbation. Seuls ceux que vous approuvez peuvent vous suivre.","ja":"有効にすると、フォロワーは承認を待つ必要があります。承認した人だけがフォローできます。","ko":"활성화하면 팔로워는 승인을 기다려야 합니다. 승인한 사람만 팔로우할 수 있습니다.","ru":"При включении подписчики должны ждать одобрения. Только одобренные могут на вас подписаться."},
            "leaderboard":          {"tr":"Liderlik Tablosunda Görün","en":"Show on Leaderboard","de":"Im Leaderboard anzeigen","es":"Mostrar en la clasificación","fr":"Afficher dans le classement","ja":"リーダーボードに表示","ko":"리더보드에 표시","ru":"Показать в таблице лидеров"},
            "leaderboardDesc":      {"tr":"Puan tablosuna adını ve istatistiklerini dahil et","en":"Include your name and stats on the scoreboard","de":"Füge deinen Namen und deine Statistiken der Rangliste hinzu","es":"Incluye tu nombre y estadísticas en la tabla de puntuación","fr":"Incluez votre nom et vos statistiques dans le classement","ja":"スコアボードに名前と統計を含めます","ko":"점수판에 이름과 통계 포함","ru":"Включите имя и статистику в таблицу очков"},
            "save":                 {"tr":"Kaydet","en":"Save","de":"Speichern","es":"Guardar","fr":"Enregistrer","ja":"保存","ko":"저장","ru":"Сохранить"},
            "saving":               {"tr":"Kaydediliyor…","en":"Saving...","de":"Wird gespeichert...","es":"Guardando...","fr":"Enregistrement en cours...","ja":"保存中...","ko":"저장 중...","ru":"Сохранение..."},
            "saved":                {"tr":"Kayıt edildi","en":"Saved","de":"Gespeichert","es":"Guardado","fr":"Enregistré","ja":"保存されました","ko":"저장됨","ru":"Сохранено"},
            "saveError":            {"tr":"Kayıt hatası, tekrar deneyin","en":"Save error, try again","de":"Speicherfehler, erneut versuchen","es":"Error al guardar, inténtalo de nuevo","fr":"Erreur d'enregistrement, réessayez","ja":"保存エラー、再試行してください","ko":"저장 오류, 다시 시도하세요","ru":"Ошибка сохранения, попробуйте снова"},
            "infoTitle":            {"tr":"Gizlilik ayarları hakkında","en":"About privacy settings","de":"Über Datenschutzeinstellungen","es":"Sobre la configuración de privacidad","fr":"À propos des paramètres de confidentialité","ja":"プライバシー設定について","ko":"개인정보 설정에 대해","ru":"О настройках конфиденциальности"},
            "levelEveryone":        {"tr":"Herkes","en":"Everyone","de":"Alle","es":"Todos","fr":"Tout le monde","ja":"全員","ko":"모두","ru":"Все"},
            "levelEveryoneDesc":    {"tr":"Tüm kullanıcılar","en":"All users","de":"Alle Benutzer","es":"Todos los usuarios","fr":"Tous les utilisateurs","ja":"全ユーザー","ko":"모든 사용자","ru":"Все пользователи"},
            "levelFollowers":       {"tr":"Takipçiler","en":"Followers","de":"Follower","es":"Seguidores","fr":"Abonnés","ja":"フォロワー","ko":"팔로워","ru":"Подписчики"},
            "levelFollowersDesc":   {"tr":"Yalnızca takip edenler","en":"Only those who follow you","de":"Nur deine Follower","es":"Solo los que te siguen","fr":"Seulement vos abonnés","ja":"フォローしている人のみ","ko":"팔로워만","ru":"Только ваши подписчики"},
            "levelNobody":          {"tr":"Kimse","en":"Nobody","de":"Niemand","es":"Nadie","fr":"Personne","ja":"誰でもない","ko":"아무도","ru":"Никто"},
            "levelNobodyDesc":      {"tr":"Kapalı","en":"Closed","de":"Geschlossen","es":"Cerrado","fr":"Fermé","ja":"閉鎖","ko":"닫힘","ru":"Закрыто"},
            "blockedUsers":         {"tr":"Engellenen Kullanıcılar","en":"Blocked Users","de":"Gesperrte Benutzer","es":"Usuarios bloqueados","fr":"Utilisateurs bloqués","ja":"ブロックされたユーザー","ko":"차단된 사용자","ru":"Заблокированные пользователи"},
            "noBlockedUsers":       {"tr":"Engellenmiş kullanıcı yok","en":"No blocked users","de":"Keine gesperrten Benutzer","es":"No hay usuarios bloqueados","fr":"Aucun utilisateur bloqué","ja":"ブロックされたユーザーはいません","ko":"차단된 사용자가 없습니다","ru":"Нет заблокированных пользователей"},
            "unblock":              {"tr":"Engeli Kaldır","en":"Unblock","de":"Entsperren","es":"Desbloquear","fr":"Débloquer","ja":"ブロック解除","ko":"차단 해제","ru":"Разблокировать"},
            "unblocking":           {"tr":"Kaldırılıyor...","en":"Removing...","de":"Wird entfernt...","es":"Eliminando...","fr":"Suppression en cours...","ja":"削除中...","ko":"제거 중...","ru":"Удаление..."},
            "followRequests":       {"tr":"Takip İstekleri","en":"Follow Requests","de":"Folgeanfragen","es":"Solicitudes de seguimiento","fr":"Demandes d'abonnement","ja":"フォローリクエスト","ko":"팔로우 요청","ru":"Запросы на подписку"},
            "followRequestsDesc":   {"tr":"Kapalı profilini takip etmek isteyenler","en":"Those who want to follow your private profile","de":"Personen, die deinem privaten Profil folgen möchten","es":"Personas que quieren seguir tu perfil privado","fr":"Personnes souhaitant suivre votre profil privé","ja":"あなたのプライベートプロフィールをフォローしたい人","ko":"비공개 프로필을 팔로우하고 싶은 사람들","ru":"Те, кто хочет подписаться на ваш закрытый профиль"},
            "requests":             {"tr":"{count} istek","en":"{count} requests","de":"{count} Anfragen","es":"{count} solicitudes","fr":"{count} demandes","ja":"{count}件のリクエスト","ko":"{count}개의 요청","ru":"{count} запросов"},
            "accept":               {"tr":"Onayla","en":"Accept","de":"Akzeptieren","es":"Aceptar","fr":"Accepter","ja":"承認","ko":"승인","ru":"Принять"},
            "reject":               {"tr":"Reddet","en":"Reject","de":"Ablehnen","es":"Rechazar","fr":"Rejeter","ja":"拒否","ko":"거부","ru":"Отклонить"},
            "noFollowRequests":     {"tr":"Bekleyen takip isteği yok","en":"No pending follow requests","de":"Keine ausstehenden Folgeanfragen","es":"No hay solicitudes de seguimiento pendientes","fr":"Aucune demande d'abonnement en attente","ja":"保留中のフォローリクエストはありません","ko":"보류 중인 팔로우 요청이 없습니다","ru":"Нет ожидающих запросов на подписку"},
        },
        "professionalPage": {
            "activeTitle":       {"tr":"Antrenör hesabı aktif","en":"Trainer account active","de":"Trainerkonto aktiv","es":"Cuenta de entrenador activa","fr":"Compte entraîneur actif","ja":"トレーナーアカウントがアクティブです","ko":"트레이너 계정 활성화됨","ru":"Тренерский аккаунт активен"},
            "lessonTracking":    {"tr":"Ders Takibi","en":"Lesson Tracking","de":"Unterrichtsverfolgung","es":"Seguimiento de lecciones","fr":"Suivi des cours","ja":"レッスン追跡","ko":"수업 추적","ru":"Отслеживание уроков"},
            "lessonTrackingDesc":{"tr":"Öğrencileri, dersleri ve ödevleri yönet","en":"Manage students, lessons and assignments","de":"Schüler, Unterricht und Hausaufgaben verwalten","es":"Administrar estudiantes, lecciones y tareas","fr":"Gérer les étudiants, les cours et les devoirs","ja":"生徒、授業、課題を管理する","ko":"학생, 수업 및 과제 관리","ru":"Управляйте учениками, уроками и заданиями"},
            "upgradeTitle":      {"tr":"Profesyonel Hesaba Yükselt","en":"Upgrade to Professional Account","de":"Auf ein professionelles Konto upgraden","es":"Actualizar a cuenta profesional","fr":"Mettre à niveau vers un compte professionnel","ja":"プロアカウントにアップグレード","ko":"전문가 계정으로 업그레이드","ru":"Перейти на профессиональный аккаунт"},
            "upgradeDesc":       {"tr":"Sporcu hesabın tüm özellikleri korunur. Onaylı antrenör olup ders araçlarına erişebilirsin.","en":"All features of your athlete account are maintained. You can become an approved trainer and access lesson tools.","de":"Alle Funktionen deines Sportlerkontos bleiben erhalten. Du kannst genehmigter Trainer werden und auf Unterrichtswerkzeuge zugreifen.","es":"Se mantienen todas las funciones de tu cuenta de atleta. Puedes convertirte en entrenador aprobado y acceder a herramientas de lecciones.","fr":"Toutes les fonctionnalités de votre compte d'athlète sont maintenues. Vous pouvez devenir un entraîneur approuvé et accéder aux outils pédagogiques.","ja":"アスリートアカウントのすべての機能が維持されます。承認されたトレーナーになり、レッスンツールにアクセスできます。","ko":"선수 계정의 모든 기능이 유지됩니다. 승인된 트레이너가 되어 수업 도구에 접근할 수 있습니다.","ru":"Все функции вашего аккаунта спортсмена сохраняются. Вы можете стать одобренным тренером и получить доступ к инструментам обучения."},
            "formTitle":         {"tr":"Antrenör Başvuru Formu","en":"Trainer Application Form","de":"Trainer-Bewerbungsformular","es":"Formulario de solicitud de entrenador","fr":"Formulaire de candidature d'entraîneur","ja":"トレーナー申請フォーム","ko":"트레이너 신청 양식","ru":"Заявка на тренера"},
            "formSubtitle":      {"tr":"Tüm bilgilerinizi eksiksiz doldurunuz.","en":"Fill in all fields completely.","de":"Füllen Sie alle Felder vollständig aus.","es":"Completa todos los campos correctamente.","fr":"Remplissez tous les champs complètement.","ja":"すべての項目を完全に記入してください。","ko":"모든 항목을 완전히 작성해 주세요.","ru":"Заполните все поля полностью."},
            "university":        {"tr":"Üniversite Adı","en":"University Name","de":"Universitätsname","es":"Nombre de la universidad","fr":"Nom de l'université","ja":"大学名","ko":"대학 이름","ru":"Название университета"},
            "universityPh":      {"tr":"Mezun olduğunuz üniversite","en":"University you graduated from","de":"Ihre Universität","es":"Tu universidad","fr":"Votre université","ja":"卒業した大学","ko":"졸업한 대학","ru":"Ваш университет"},
            "department":        {"tr":"Bölüm","en":"Department","de":"Abteilung","es":"Departamento","fr":"Département","ja":"学部","ko":"학과","ru":"Факультет"},
            "departmentPh":      {"tr":"Mezun olduğunuz bölüm","en":"Department you graduated from","de":"Ihre Abteilung","es":"Tu departamento","fr":"Votre département","ja":"卒業した学部","ko":"졸업한 학과","ru":"Ваш факультет"},
            "branches":          {"tr":"Branşlarınız","en":"Your Branches","de":"Ihre Zweige","es":"Tus ramas","fr":"Vos branches","ja":"専門分野","ko":"전문 분야","ru":"Ваши ответвления"},
            "lessonTypes":       {"tr":"Ders Türleri","en":"Lesson Types","de":"Unterrichtsarten","es":"Tipos de lecciones","fr":"Types de cours","ja":"レッスンの種類","ko":"수업 유형","ru":"Виды уроков"},
            "lessonTypesDesc":   {"tr":"Verdiğiniz ders türlerini seçin (birden fazla seçilebilir)","en":"Select the lesson types you give (multiple selection allowed)","de":"Wählen Sie die Unterrichtsarten aus (Mehrfachauswahl möglich)","es":"Selecciona los tipos de lecciones (se pueden seleccionar varios)","fr":"Sélectionnez les types de cours (sélection multiple autorisée)","ja":"提供するレッスンの種類を選択してください（複数選択可）","ko":"제공하는 수업 유형을 선택하세요 (다중 선택 가능)","ru":"Выберите типы уроков (возможен множественный выбор)"},
            "equipment":         {"tr":"Öğrencilere Ekipman Sağlıyorum","en":"I Provide Equipment to Students","de":"Ich stelle Ausrüstung für Schüler bereit","es":"Proporciono equipamiento a los estudiantes","fr":"Je fournis du matériel aux étudiants","ja":"生徒に用具を提供します","ko":"학생들에게 장비를 제공합니다","ru":"Я предоставляю снаряжение студентам"},
            "equipmentDesc":     {"tr":"Dersler için gerekli ekipmanları tarafımdan karşılanacaktır.","en":"Required equipment for lessons will be provided by me.","de":"Ich stelle die für den Unterricht benötigte Ausrüstung bereit.","es":"Proporcionaré el equipo necesario para las lecciones.","fr":"Je fournirai l'équipement nécessaire aux cours.","ja":"レッスンに必要な用具は私が提供します。","ko":"수업에 필요한 장비는 제가 제공합니다.","ru":"Необходимое снаряжение для уроков буду предоставлять я."},
            "gymName":           {"tr":"Çalıştığınız Salon / Spor Merkezi","en":"Gym / Sports Center","de":"Fitnessstudio / Sportzentrum","es":"Gimnasio / Centro deportivo","fr":"Salle de sport / Centre sportif","ja":"ジム / スポーツセンター","ko":"헬스장 / 스포츠 센터","ru":"Зал / Спортивный центр"},
            "gymNamePh":         {"tr":"Çalıştığınız kurumun adı","en":"Name of the institution","de":"Name der Einrichtung","es":"Nombre de la institución","fr":"Nom de l'institution","ja":"機関の名前","ko":"기관 이름","ru":"Название учреждения"},
            "experience":        {"tr":"Deneyim (yıl)","en":"Experience (years)","de":"Erfahrung (Jahre)","es":"Experiencia (años)","fr":"Expérience (années)","ja":"経験 (年)","ko":"경력 (년)","ru":"Опыт (лет)"},
            "experiencePh":      {"tr":"Deneyim süreniz","en":"Your years of experience","de":"Ihre Erfahrungsjahre","es":"Tus años de experiencia","fr":"Vos années d'expérience","ja":"経験年数","ko":"경력 연수","ru":"Ваши годы опыта"},
            "certNote":          {"tr":"Eğitim & Sertifika Bilgisi","en":"Education & Certificate Info","de":"Ausbildungs- & Zertifikatinformationen","es":"Información de educación y certificado","fr":"Informations éducation et certificat","ja":"教育と資格情報","ko":"교육 및 자격증 정보","ru":"Информация об образовании и сертификатах"},
            "certNotePh":        {"tr":"Sahip olduğunuz sertifikaları kısaca belirtin","en":"Briefly state your certificates","de":"Zertifikate kurz angeben","es":"Mencione brevemente sus certificados","fr":"Mentionnez brièvement vos certificats","ja":"資格を簡単に記載してください","ko":"자격증을 간단히 기재해 주세요","ru":"Кратко укажите ваши сертификаты"},
            "submit":            {"tr":"Başvuruyu Gönder","en":"Submit Application","de":"Bewerbung einreichen","es":"Enviar solicitud","fr":"Soumettre la candidature","ja":"申請を提出","ko":"신청 제출","ru":"Подать заявку"},
            "selected":          {"tr":"✓ Seçildi","en":"✓ Selected","de":"✓ Ausgewählt","es":"✓ Seleccionado","fr":"✓ Sélectionné","ja":"✓ 選択済み","ko":"✓ 선택됨","ru":"✓ Выбрано"},
            "badgeTitle":        {"tr":"Antrenör Rozeti Bilgileri","en":"Trainer Badge Information","de":"Trainer-Abzeichen-Informationen","es":"Información de la insignia de entrenador","fr":"Informations du badge d'entraîneur","ja":"トレーナーバッジ情報","ko":"트레이너 배지 정보","ru":"Информация о badge тренера"},
            "badgeVisible":      {"tr":"Rozetine tıklayan herkes antrenör bilgilerini görebilir","en":"Anyone who clicks your badge can see trainer info","de":"Jeder, der auf das Abzeichen klickt, kann Trainerinformationen sehen","es":"Cualquiera que haga clic en la insignia puede ver la información del entrenador","fr":"Tout le monde qui clique sur le badge peut voir les informations d'entraîneur","ja":"バッジをクリックした人は誰でもトレーナー情報を見ることができます","ko":"배지를 클릭하는 누구나 트레이너 정보를 볼 수 있습니다","ru":"Все, кто нажмет на badge, могут видеть информацию тренера"},
            "badgeHidden":       {"tr":"Sadece rozet görünür, bilgiler popup'ta gizli","en":"Only the badge is visible, info is hidden","de":"Nur das Abzeichen ist sichtbar, Informationen sind ausgeblendet","es":"Solo la insignia es visible, la información está oculta","fr":"Seul le badge est visible, les informations sont masquées","ja":"バッジのみ表示され、情報は非表示です","ko":"배지만 보이고, 정보는 숨겨져 있습니다","ru":"Виден только badge, информация скрыта"},
            "universityRequired":{"tr":"Üniversite adı zorunludur","en":"University name is required","de":"Universitätsname ist erforderlich","es":"El nombre de la universidad es obligatorio","fr":"Le nom de l'université est obligatoire","ja":"大学名は必須です","ko":"대학 이름은 필수입니다","ru":"Название университета обязательно"},
            "departmentRequired":{"tr":"Bölüm adı zorunludur","en":"Department name is required","de":"Abteilungsname ist erforderlich","es":"El nombre del departamento es obligatorio","fr":"Le nom du département est obligatoire","ja":"学部名は必須です","ko":"학과 이름은 필수입니다","ru":"Название факультета обязательно"},
            "branchRequired":    {"tr":"En az bir branş seçiniz","en":"Please select at least one branch","de":"Bitte wählen Sie mindestens einen Zweig","es":"Por favor seleccione al menos una rama","fr":"Veuillez sélectionner au moins une branche","ja":"少なくとも1つの専門分野を選択してください","ko":"적어도 하나의 전문 분야를 선택해 주세요","ru":"Пожалуйста, выберите хотя бы одно ответвление"},
            "lessonTypeRequired":{"tr":"En az bir ders türü seçiniz","en":"Please select at least one lesson type","de":"Bitte wählen Sie mindestens eine Unterrichtsart","es":"Por favor seleccione al menos un tipo de lección","fr":"Veuillez sélectionner au moins un type de cours","ja":"少なくとも1つのレッスンの種類を選択してください","ko":"적어도 하나의 수업 유형을 선택해 주세요","ru":"Пожалуйста, выберите хотя бы один тип урока"},
            "applicationSent":   {"tr":"✅ Antrenör hesabınız aktif edildi! Sayfayı yenileyiniz.","en":"✅ Your trainer account has been activated! Please refresh the page.","de":"✅ Ihr Trainerkonto wurde aktiviert! Bitte aktualisieren Sie die Seite.","es":"✅ Tu cuenta de entrenador ha sido activada. Por favor actualiza la página.","fr":"✅ Votre compte entraîneur a été activé! Veuillez actualiser la page.","ja":"✅ トレーナーアカウントが有効になりました！ページを更新してください。","ko":"✅ 트레이너 계정이 활성화되었습니다! 페이지를 새로 고침해 주세요.","ru":"✅ Ваш тренерский аккаунт активирован! Пожалуйста, обновите страницу."},
            "applicationFailed": {"tr":"Başvuru gönderilemedi","en":"Could not send application","de":"Bewerbung konnte nicht gesendet werden","es":"No se pudo enviar la solicitud","fr":"Impossible d'envoyer la candidature","ja":"申請を送信できませんでした","ko":"신청을 보낼 수 없었습니다","ru":"Не удалось отправить заявку"},
            "badgeSaveFailed":   {"tr":"Ayar kaydedilemedi","en":"Setting could not be saved","de":"Einstellung konnte nicht gespeichert werden","es":"No se pudo guardar la configuración","fr":"Impossible d'enregistrer le paramètre","ja":"設定を保存できませんでした","ko":"설정을 저장할 수 없었습니다","ru":"Не удалось сохранить настройку"},
            "badgeVisibleMsg":   {"tr":"Rozet bilgileri herkese açık","en":"Badge info is now public","de":"Abzeichen-Informationen sind jetzt öffentlich","es":"La información de la insignia ahora es pública","fr":"Les informations du badge sont maintenant publiques","ja":"バッジ情報が公開されました","ko":"배지 정보가 공개되었습니다","ru":"Информация badge теперь общедоступна"},
            "badgeHiddenMsg":    {"tr":"Rozet bilgileri gizlendi","en":"Badge info is now hidden","de":"Abzeichen-Informationen wurden ausgeblendet","es":"La información de la insignia ahora está oculta","fr":"Les informations du badge sont maintenant masquées","ja":"バッジ情報が非表示になりました","ko":"배지 정보가 숨겨졌습니다","ru":"Информация badge теперь скрыта"},
            "genericError":      {"tr":"Bir hata oluştu","en":"An error occurred","de":"Ein Fehler ist aufgetreten","es":"Ocurrió un error","fr":"Une erreur est survenue","ja":"エラーが発生しました","ko":"오류가 발생했습니다","ru":"Произошла ошибка"},
            "lessonType_birebir":     {"tr":"Birebir","en":"One-on-One","de":"Einzeln","es":"Uno a uno","fr":"Un à un","ja":"個人レッスン","ko":"일대일","ru":"Один на один"},
            "lessonType_birebir_desc":{"tr":"Bireysel ders","en":"Individual lesson","de":"Einzelunterricht","es":"Lección individual","fr":"Cours individuel","ja":"個人レッスン","ko":"개인 수업","ru":"Индивидуальный урок"},
            "lessonType_grup":        {"tr":"Grup","en":"Group","de":"Gruppe","es":"Grupo","fr":"Groupe","ja":"グループ","ko":"그룹","ru":"Группа"},
            "lessonType_grup_desc":   {"tr":"Grup dersi","en":"Group lesson","de":"Gruppenunterricht","es":"Lección grupal","fr":"Cours de groupe","ja":"グループレッスン","ko":"그룹 수업","ru":"Групповой урок"},
            "lessonType_cocuk":       {"tr":"Çocuk","en":"Children","de":"Kinder","es":"Niños","fr":"Enfants","ja":"子ども","ko":"어린이","ru":"Дети"},
            "lessonType_cocuk_desc":  {"tr":"Çocuklara yönelik","en":"For children","de":"Für Kinder","es":"Para niños","fr":"Pour les enfants","ja":"子どもたちのために","ko":"어린이를 위해","ru":"Для детей"},
            "lessonType_performans":      {"tr":"Performans","en":"Performance","de":"Leistung","es":"Rendimiento","fr":"Performance","ja":"パフォーマンス","ko":"퍼포먼스","ru":"Производительность"},
            "lessonType_performans_desc": {"tr":"Yüksek performans","en":"High performance","de":"Hochleistung","es":"Alto rendimiento","fr":"Haute performance","ja":"高パフォーマンス","ko":"고성능","ru":"Высокая производительность"},
        },
    },
    "messages": {
        "directMessage":      {"tr":"Direkt mesaj","en":"Direct message","de":"Direktnachricht","es":"Mensaje directo","fr":"Message direct","ja":"ダイレクトメッセージ","ko":"다이렉트 메시지","ru":"Прямое сообщение"},
        "noMessages":         {"tr":"Henüz mesaj yok. İlk mesajı siz gönderin!","en":"No messages yet. Send the first!","de":"Noch keine Nachrichten. Senden Sie die erste!","es":"Aún no hay mensajes. ¡Envía el primero!","fr":"Pas encore de messages. Envoyez le premier!","ja":"まだメッセージはありません。最初のメッセージを送ってください！","ko":"아직 메시지가 없습니다. 첫 메시지를 보내세요!","ru":"Сообщений пока нет. Отправьте первое!"},
        "conversation":       {"tr":"Sohbet","en":"Conversation","de":"Gespräch","es":"Conversación","fr":"Conversation","ja":"会話","ko":"대화","ru":"Разговор"},
        "noConversationsDesc":{"tr":"Eşleşme gerçekleştiğinde veya birine doğrudan mesaj attığınızda buradan görürsünüz","en":"You'll see them here when you match or send a direct message","de":"Hier werden sie angezeigt, wenn Sie sich matchen oder eine Direktnachricht senden","es":"Los verás aquí cuando hagas un match o envíes un mensaje directo","fr":"Vous les verrez ici lors d'un match ou d'un message direct","ja":"マッチしたとき、またはダイレクトメッセージを送ったときにここに表示されます","ko":"매칭되거나 다이렉트 메시지를 보내면 여기에 표시됩니다","ru":"Они появятся здесь, когда вы заматчитесь или отправите прямое сообщение"},
        "loadFailed":         {"tr":"Mesajlar yüklenemedi","en":"Could not load messages","de":"Nachrichten konnten nicht geladen werden","es":"No se pudieron cargar los mensajes","fr":"Impossible de charger les messages","ja":"メッセージを読み込めませんでした","ko":"메시지를 불러올 수 없었습니다","ru":"Не удалось загрузить сообщения"},
        "convoLoadFailed":    {"tr":"Sohbet yüklenemedi","en":"Could not load conversation","de":"Gespräch konnte nicht geladen werden","es":"No se pudo cargar la conversación","fr":"Impossible de charger la conversation","ja":"会話を読み込めませんでした","ko":"대화를 불러올 수 없었습니다","ru":"Не удалось загрузить разговор"},
        "messageFailed":      {"tr":"Mesaj gönderilemedi","en":"Could not send message","de":"Nachricht konnte nicht gesendet werden","es":"No se pudo enviar el mensaje","fr":"Impossible d'envoyer le message","ja":"メッセージを送信できませんでした","ko":"메시지를 보낼 수 없었습니다","ru":"Не удалось отправить сообщение"},
        "reportUser":         {"tr":"🚩 Kullanıcıyı Şikayet Et","en":"🚩 Report User","de":"🚩 Benutzer melden","es":"🚩 Reportar usuario","fr":"🚩 Signaler l'utilisateur","ja":"🚩 ユーザーを報告","ko":"🚩 사용자 신고","ru":"🚩 Пожаловаться на пользователя"},
        "reportReason":       {"tr":"Sebep","en":"Reason","de":"Grund","es":"Razón","fr":"Raison","ja":"理由","ko":"이유","ru":"Причина"},
        "reportDesc":         {"tr":"Açıklama (opsiyonel)","en":"Description (optional)","de":"Beschreibung (optional)","es":"Descripción (opcional)","fr":"Description (optionnelle)","ja":"説明（任意）","ko":"설명 (선택 사항)","ru":"Описание (необязательно)"},
        "reportDescPh":       {"tr":"Detaylı bilgi verebilirsiniz...","en":"You can provide more details...","de":"Sie können weitere Details angeben...","es":"Puede proporcionar más detalles...","fr":"Vous pouvez fournir plus de détails...","ja":"詳細情報を提供できます...","ko":"자세한 정보를 제공할 수 있습니다...","ru":"Вы можете предоставить больше деталей..."},
        "reportSending":      {"tr":"Gönderiliyor...","en":"Sending...","de":"Wird gesendet...","es":"Enviando...","fr":"Envoi en cours...","ja":"送信中...","ko":"전송 중...","ru":"Отправка..."},
        "reportSend":         {"tr":"Gönder","en":"Send","de":"Senden","es":"Enviar","fr":"Envoyer","ja":"送信","ko":"보내기","ru":"Отправить"},
        "reportCancel":       {"tr":"İptal","en":"Cancel","de":"Abbrechen","es":"Cancelar","fr":"Annuler","ja":"キャンセル","ko":"취소","ru":"Отмена"},
        "reasonSpam":         {"tr":"📧 Spam","en":"📧 Spam","de":"📧 Spam","es":"📧 Spam","fr":"📧 Spam","ja":"📧 スパム","ko":"📧 스팸","ru":"📧 Спам"},
        "reasonHarassment":   {"tr":"😡 Taciz / Zorbalık","en":"😡 Harassment / Bullying","de":"😡 Belästigung / Mobbing","es":"😡 Acoso / Intimidación","fr":"😡 Harcèlement / Intimidation","ja":"😡 ハラスメント/いじめ","ko":"😡 괴롭힘 / 왕따","ru":"😡 Домогательство / Буллинг"},
        "reasonFakeProfile":  {"tr":"🎭 Sahte Profil","en":"🎭 Fake Profile","de":"🎭 Gefälschtes Profil","es":"🎭 Perfil falso","fr":"🎭 Faux profil","ja":"🎭 偽プロフィール","ko":"🎭 가짜 프로필","ru":"🎭 Поддельный профиль"},
        "reasonInappropriate":{"tr":"⚠️ Uygunsuz İçerik","en":"⚠️ Inappropriate Content","de":"⚠️ Unangemessener Inhalt","es":"⚠️ Contenido inapropiado","fr":"⚠️ Contenu inapproprié","ja":"⚠️ 不適切なコンテンツ","ko":"⚠️ 부적절한 콘텐츠","ru":"⚠️ Неподходящий контент"},
        "reasonScam":         {"tr":"💸 Dolandırıcılık","en":"💸 Scam","de":"💸 Betrug","es":"💸 Estafa","fr":"💸 Arnaque","ja":"💸 詐欺","ko":"💸 사기","ru":"💸 Мошенничество"},
        "reasonOther":        {"tr":"🔖 Diğer","en":"🔖 Other","de":"🔖 Andere","es":"🔖 Otro","fr":"🔖 Autre","ja":"🔖 その他","ko":"🔖 기타","ru":"🔖 Другое"},
        "reportReceived":     {"tr":"Şikayetiniz alındı","en":"Your complaint has been received","de":"Ihre Beschwerde wurde erhalten","es":"Su queja ha sido recibida","fr":"Votre plainte a été reçue","ja":"ご意見を受け取りました","ko":"민원이 접수되었습니다","ru":"Ваша жалоба получена"},
        "reportFailed":       {"tr":"Şikayet gönderilemedi","en":"Complaint could not be sent","de":"Beschwerde konnte nicht gesendet werden","es":"No se pudo enviar la queja","fr":"Impossible d'envoyer la plainte","ja":"苦情を送信できませんでした","ko":"민원을 보낼 수 없었습니다","ru":"Не удалось отправить жалобу"},
        "connectionError":    {"tr":"Hata oluştu","en":"Error occurred","de":"Fehler aufgetreten","es":"Error ocurrido","fr":"Erreur survenue","ja":"エラーが発生しました","ko":"오류가 발생했습니다","ru":"Произошла ошибка"},
    },
}


def deep_merge(base: dict, updates: dict) -> dict:
    """Deep merge updates into base, preserving existing values."""
    result = copy.deepcopy(base)
    for key, value in updates.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        elif key not in result:
            result[key] = value
        # else: key exists and is not a dict—keep existing (don't overwrite translations)
    return result


def build_locale_dict(structure: dict, locale: str) -> dict:
    """
    Recursively convert the NEW_KEYS structure (with per-locale leaf dicts)
    into a locale-specific dict.
    """
    result = {}
    for key, value in structure.items():
        if isinstance(value, dict):
            # Check if this is a leaf node (all values are dicts with locale keys)
            if all(isinstance(v, (str, int, float)) for v in value.values()):
                # This is a per-locale string dict
                result[key] = value.get(locale, value.get("en", ""))
            else:
                result[key] = build_locale_dict(value, locale)
        else:
            result[key] = value
    return result


def is_leaf_translations(d: dict) -> bool:
    """Check if a dict is a per-locale translation dict (all values are strings)."""
    return bool(d) and all(isinstance(v, str) for v in d.values()) and "en" in d


def build_locale_value(value, locale: str):
    """Convert a value in NEW_KEYS to a locale-specific value."""
    if isinstance(value, dict):
        if is_leaf_translations(value):
            return value.get(locale, value.get("en", ""))
        else:
            return {k: build_locale_value(v, locale) for k, v in value.items()}
    return value


def process_new_keys(locale: str) -> dict:
    """Build the new keys dict for a specific locale."""
    result = {}
    for namespace, content in NEW_KEYS.items():
        result[namespace] = build_locale_value(content, locale)
    return result


def main():
    for locale in LOCALES:
        path = os.path.join(BASE, f"{locale}.json")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        new_for_locale = process_new_keys(locale)
        merged = deep_merge(data, new_for_locale)

        with open(path, "w", encoding="utf-8") as f:
            json.dump(merged, f, ensure_ascii=False, indent=2)

        print(f"✓ Updated {locale}.json")

    print("\nAll locale files updated!")


if __name__ == "__main__":
    main()
