# GemBook (Flutter)

Mobile app port of the React frontend in `../frontend`, matching the **mobile** layout, colors, and API.

Production API: `https://gems.nexgenai.lk/api`

## Run

```bash
cd Gem-Book
flutter pub get
flutter run
```

Backend URL is set in `lib/config.dart`. Change `kBackendUrl` if you need a local API (`http://localhost:2233/api`).

## Screens

Feed, Marketplace, Vendors, Dealer profile, Product, Add listing, Messages, Profile, Login, Community — same routes and flows as the React app.
