import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider, addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
import de from 'react-intl/locale-data/de';
import es from 'react-intl/locale-data/es';
import fr from 'react-intl/locale-data/fr';
import it from 'react-intl/locale-data/it';
import pt from 'react-intl/locale-data/pt';
import nl from 'react-intl/locale-data/nl';
import pl from 'react-intl/locale-data/pl';
import ru from 'react-intl/locale-data/ru';
import uk from 'react-intl/locale-data/uk';
import tr from 'react-intl/locale-data/tr';
import id from 'react-intl/locale-data/id';
import vi from 'react-intl/locale-data/vi';
import ja from 'react-intl/locale-data/ja';
import ko from 'react-intl/locale-data/ko';
import zh from 'react-intl/locale-data/zh';
import hi from 'react-intl/locale-data/hi';
import bn from 'react-intl/locale-data/bn';
import ar from 'react-intl/locale-data/ar';
import { DEFAULT_LANGUAGE } from 'app/client_config';
import tt from 'counterpart';

addLocaleData([
    ...en, ...de, ...es, ...fr, ...it, ...pt, ...nl, ...pl,
    ...ru, ...uk, ...tr, ...id, ...vi, ...ja, ...ko, ...zh,
    ...hi, ...bn, ...ar,
]);

// Englisch (Default)
tt.registerTranslations('en', require('counterpart/locales/en'));
tt.registerTranslations('en', require('app/locales/en.json'));

// Bestand
tt.registerTranslations('es', require('app/locales/counterpart/es'));
tt.registerTranslations('es', require('app/locales/es.json'));

tt.registerTranslations('ru', require('counterpart/locales/ru'));
tt.registerTranslations('ru', require('app/locales/ru.json'));

tt.registerTranslations('fr', require('app/locales/counterpart/fr'));
tt.registerTranslations('fr', require('app/locales/fr.json'));

tt.registerTranslations('it', require('app/locales/counterpart/it'));
tt.registerTranslations('it', require('app/locales/it.json'));

tt.registerTranslations('ko', require('app/locales/counterpart/ko'));
tt.registerTranslations('ko', require('app/locales/ko.json'));

tt.registerTranslations('zh', require('app/locales/counterpart/zh'));
tt.registerTranslations('zh', require('app/locales/zh.json'));

tt.registerTranslations('pl', require('app/locales/counterpart/pl'));
tt.registerTranslations('pl', require('app/locales/pl.json'));

tt.registerTranslations('ja', require('app/locales/counterpart/ja'));
tt.registerTranslations('ja', require('app/locales/ja.json'));

tt.registerTranslations('uk', require('app/locales/counterpart/uk'));
tt.registerTranslations('uk', require('app/locales/uk.json'));

// Phase-1-Erweiterung
tt.registerTranslations('de', require('app/locales/counterpart/de'));
tt.registerTranslations('de', require('app/locales/de.json'));

tt.registerTranslations('pt', require('app/locales/counterpart/pt'));
tt.registerTranslations('pt', require('app/locales/pt.json'));

tt.registerTranslations('nl', require('app/locales/counterpart/nl'));
tt.registerTranslations('nl', require('app/locales/nl.json'));

tt.registerTranslations('tr', require('app/locales/counterpart/tr'));
tt.registerTranslations('tr', require('app/locales/tr.json'));

tt.registerTranslations('id', require('app/locales/counterpart/id'));
tt.registerTranslations('id', require('app/locales/id.json'));

tt.registerTranslations('vi', require('app/locales/counterpart/vi'));
tt.registerTranslations('vi', require('app/locales/vi.json'));

tt.registerTranslations('hi', require('app/locales/counterpart/hi'));
tt.registerTranslations('hi', require('app/locales/hi.json'));

tt.registerTranslations('bn', require('app/locales/counterpart/bn'));
tt.registerTranslations('bn', require('app/locales/bn.json'));

tt.registerTranslations('ar', require('app/locales/counterpart/ar'));
tt.registerTranslations('ar', require('app/locales/ar.json'));

if (process.env.NODE_ENV === 'production') {
    tt.setFallbackLocale('en');
}

// Liste der unterstützten Sprachen — analog zur LocaleNames-Map
const SUPPORTED_LOCALES = [
    'en', 'de', 'fr', 'it', 'es', 'pt', 'nl', 'pl', 'ru', 'uk',
    'tr', 'id', 'vi', 'ja', 'ko', 'zh', 'hi', 'bn', 'ar',
];

function detectBrowserLocale() {
    if (typeof navigator === 'undefined') return null;
    const langs = navigator.languages || [
        navigator.language || navigator.userLanguage,
    ];
    for (const lang of langs) {
        if (!lang) continue;
        const short = lang.toLowerCase().split('-')[0];
        if (SUPPORTED_LOCALES.indexOf(short) !== -1) return short;
    }
    return null;
}

class Translator extends React.Component {
    render() {
        // Wenn der User noch keine Sprache gesetzt hat, Browser-Sprache verwenden
        let language = this.props.locale;
        if (!language || SUPPORTED_LOCALES.indexOf(language) === -1) {
            language = detectBrowserLocale() || DEFAULT_LANGUAGE;
        }
        tt.setLocale(language);
        return (
            <IntlProvider
                // to ensure dynamic language change, "key" property with same "locale" info must be added
                // see: https://github.com/yahoo/react-intl/wiki/Components#multiple-intl-contexts
                key={language}
                locale={language}
                defaultLocale={DEFAULT_LANGUAGE}
            >
                {this.props.children}
            </IntlProvider>
        );
    }
}

export default connect((state, ownProps) => {
    const locale = state.app.getIn(['user_preferences', 'locale']);
    return { ...ownProps, locale };
})(Translator);

export const FormattedHTMLMessage = ({ id, params, className }) => (
    <div
        className={'FormattedHTMLMessage' + (className ? ` ${className}` : '')}
        dangerouslySetInnerHTML={{ __html: tt(id, params) }}
    />
);
