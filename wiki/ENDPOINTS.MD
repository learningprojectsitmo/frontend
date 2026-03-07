### Эндпоинты для авторизации

- /auth/login

Content-Type: application/x-www-form-urlencoded

grant_type: password
email: string
password: string (длина от 5 до 64 символов)
remember_me: boolean

Response: access_token: string
---

- /auth/createacc

`первый запрос для регистрации, нужен чтобы сервер отправил по почте код подтверждения, который пользователь введет на следующем шаге`

Content-Type: application/json

email: string  
password: string (длина от 5 до 64 символов)

---

- /auth/register

`второй запрос для регистрации, который подтверждает код из почты`

Content-Type: application/json

email: string
confirmationCode: 111111 string

---

- /auth/resendcode

`запрос для повторной отправки кода подтверждения на почту`

Content-Type: application/json

email: string

---

- /auth/addcontacts

`третий запрос для регистрации, добавление контактов (телеграм, вк) и настройка их отображения в профиле, после которого приходит access токен и пользователь считается полностью зарегистрированным и авторизованным в системе`

Content-Type: application/json

email: string             
telegram: '@yournickname' 
vk: '@yournickname'       
showMyContacts: boolean 

Response: access_token: string
---

- /auth/resetemail

`запрос для начала процесса восстановления пароля, сервер отправляет на почту ссылку на форму смены пароля`

Content-Type: application/json

email: string

---

- /auth/resetpassword

`запрос для завершения процесса восстановления пароля`

Content-Type: application/json

password: string (длина от 5 до 64 символов)
special_token: string `нужен какой нибудь ключ чтобы сторонний пользователь не мог просто так вызвать этот эндпоинт и сбросить пароль, например, uuid, который придет в теле ссылки на почту`

---

- /auth/logout
  оставялем как есть
