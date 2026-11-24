# Happy Snouts

Aplicativo de cuidados com pets (projeto SENAI), feito em Flutter.
Usa o mesmo backend do site (pasta `backend/`, Node + Express + MySQL).

## Como executar

1. Ligue o backend (na pasta `backend/`, com o MySQL rodando e o `.env` configurado):

   ```bash
   npm run dev
   ```

2. Rode o app:

   ```bash
   flutter pub get
   flutter run
   ```

O endereço da API fica em `lib/config/app_config.dart`:

| Onde o app roda          | Endereço usado            |
|--------------------------|---------------------------|
| Todas as plataformas (padrão) | `https://gracious-lightseagreen-gnat-00.hostingersite.com` |
| Backend personalizado | `flutter run --dart-define=API_URL=https://seu-dominio.com` |

> **Windows:** o `flutter run` no Windows exige o **Modo de Desenvolvedor**
> ligado (`start ms-settings:developers`).

Validação (os testes usam um backend falso em memória, `test/fake_backend.dart`,
então não precisam do servidor):

```bash
flutter analyze
dart format lib test
flutter test
```

O formatador usa linhas de até 120 colunas (`analysis_options.yaml`).

## Gerar o APK (Android)

O app é publicado como `com.happysnouts.app`. A versão final usa só HTTPS; HTTP fica
liberado apenas nos builds de desenvolvimento (`src/debug/AndroidManifest.xml`).

1. Crie a chave de assinatura **uma única vez** e guarde o arquivo e as senhas num
   lugar seguro (sem ela não dá para publicar atualizações do app):

   ```bash
   keytool -genkey -v -keystore android/app/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```

2. Crie `android/key.properties` (não vai para o Git, assim como o `.jks`):

   ```properties
   storePassword=senha-da-chave
   keyPassword=senha-da-chave
   keyAlias=upload
   storeFile=upload-keystore.jks
   ```

3. Atualize `version:` no `pubspec.yaml` (ex.: `1.0.1+2`; o número depois do `+` sempre sobe) e gere o APK:

   ```bash
   flutter build apk --release
   ```

   O arquivo sai em `build/app/outputs/flutter-apk/app-release.apk`.

Sem o `key.properties`, o build usa a chave de teste do Flutter (serve para testar, não para publicar).

Ícone do app: a imagem fica em `assets/icon/`; depois de trocar, rode `dart run flutter_launcher_icons`.

## O que vem do backend

| Recurso | Rotas |
|---|---|
| Login, cadastro, sessão (JWT de 8h salvo no aparelho) | `/auth/cliente/login`, `/auth/cliente/registrar` |
| Meus dados e troca de senha | `/cliente/:id`, `/cliente/:id/senha` |
| Produtos | `/produtos` |
| Carrinho e finalização da compra (Pix, cartão em até 3x ou boleto, como no site) | `/carrinho`, `/carrinho/itens`, `/carrinho/entrega`, `/carrinho/finalizar` |
| Favoritos | `/favoritos` |
| Endereços | `/endereco` |
| Cartões (só os 4 últimos dígitos) | `/pagamento` |
| Pets e dispositivos (coleira / alimentador ligados ao pet) | `/pets` |
| Fotos do usuário, do pet e dos produtos | `/upload` |
| Área do funcionário (login em "Sou funcionário"): produtos e categorias | `/auth/funcionario/login`, `/produtos/tudo`, `/produtos`, `/categoriaProduto` |
| Calendário de cuidados | `/lembretes` |
| BlogSnouts | `/postBlog` |

Ficam **no aparelho** (`shared_preferences`): o token da sessão, o tema, as
preferências de notificação e os dados do pet que o banco ainda não tem
colunas para guardar (espécie, sexo, datas de nascimento e vermifugação,
vacinas, alimentação e observações).

Ainda **sem backend** (dados locais do app): cupons, pedidos ("Meus pedidos"
some ao fechar o app, porque o backend não tem tabela de pedidos), comedouro,
rastreador, Fale Conosco e recuperação de senha. O pagamento é feito na entrega.

## Arquitetura

```
lib/
  main.dart     inicialização (tema, sessão, notificações) e o MaterialApp
  config/       AppConfig (nome, versão, endereço da API)
  data/         dados de demonstração que ainda não existem no backend
                (cupons, comedouro, passeios da coleira)
  models/       modelos de dados
  services/     único ponto de acesso a dados: ApiClient (HTTP + token), um
                serviço por recurso e os controllers compartilhados (sessão,
                carrinho, favoritos)
  screens/
    auth/       boas-vindas, login, cadastro, confirmação de e-mail, senha
    home/       tela inicial
    shop/       produtos, detalhes, carrinho, checkout, cupons, favoritos
    orders/     meus pedidos e detalhes do pedido
    pets/       meus pets, cadastro/perfil do pet e agenda
    devices/    dispositivos, pareamento, rastreador e alimentador
    blog/       BlogSnouts: lista, post e editor
    profile/    perfil, meus dados, endereços, pagamentos, notificações...
    support/    fale conosco e central de ajuda
    employee/   painel da loja (uma aba por arquivo)
  theme/        cores, tema claro/escuro e `context.palette`
  utils/        formatação (R$, datas, telefone), validações e máscaras
  widgets/      componentes reutilizáveis; `widgets/devices/` tem os da
                coleira e do alimentador
```

O estado compartilhado segue o padrão que o projeto já usava no
`ThemeController`: `ValueNotifier` + `ValueListenableBuilder`, sem bibliotecas
extras de gerenciamento de estado. Carrinho e favoritos mudam na tela na hora
e são enviados ao backend em seguida; se der erro, aparece a mensagem e o app
volta ao que está no banco.

## Pendências conhecidas

- Tabela/rotas de pedidos e de cupons no backend.
- Colunas no banco para os dados extras do pet (hoje ficam no aparelho).
- Mapa em tempo real e histórico de rotas do rastreador (dependem da coleira
  e de um serviço de mapas com chave de API).
- Comunicação com o comedouro físico.
- Chat da aba Mensagens (não há serviço de mensagens).
- Cobrança de verdade do Pix/boleto/cartão (hoje, como no site, a forma de
  pagamento só aparece no resumo do pedido).
- Notificações push.
- Splash nativa com o logo (hoje é a tela branca padrão do Flutter).
