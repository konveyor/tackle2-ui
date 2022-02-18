# Internationalization

To translate Tackle UI into a new language you only need to create a new file `public/locales/{myLanguageCode}/translation.json`. Where `myLanguageCode` can be any `ISO 639-1` code value.

## How to add a new language

Steps:

- Clone this repository.
- Locate your terminal in the cloned repository and execute:

```
npm install
```

- Edit the file `i18next-parser.config.js` and add your new language code to the array `locales`. E.g.

```
locales: ["en", "es", "myLanguageCode"]
```

- Generate the folder and files for the new language:

```
npm extract
```

The previous command created a file `public/locales/{myLanguageCode}/translation.json`; the content of this file should be the translated new language. As a reference you can use the english version of the translation located at [public/locales/en/translation.json](https://github.com/konveyor/tackle-ui/blob/main/public/locales/en/translation.json)

> As soon as you feel confident, please open a new Pull Request with your changes and make it part of the official repository.

## How to see the new translation in action?

To see your changes in action you will need to start Tackle UI in development mode. For starting Tackle UI in development mode please follow the instruction at [Starting the UI](https://github.com/konveyor/tackle-ui#starting-the-ui)

Steps:

- Start Tackle UI in dev mode following [Starting the UI](https://github.com/konveyor/tackle-ui#starting-the-ui) instructions.
- Go to Keycloak http://localhost:8180/auth/admin/ and use `username=admin, password=admin`. Go to `Realm settings > themes > Supported locales` and select the new language you are adding. Finally click on `Save`.
- Go to http://localhost:3000/ and you should be redirected to the Login page where you are able to select your new language.

At this point you should be able to see your new language already translated into the language you selected in the Login phase.

> Remember that since you are in dev mode any change you do to the folder `public/locales` should be automatically loaded in your browser.

## Why the questionnaire (assessment process) is not translated?

The questionnaire is data comming from https://github.com/konveyor/tackle-pathfinder hence the translation to a new language of the questionnaire should be done in that repository.
