import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {translate} from '@docusaurus/Translate';
import {useLocation} from '@docusaurus/router';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import IconLanguage from '@theme/Icon/Language';

import styles from './styles.module.css';

function normalizeLocalePath(pathname) {
  if (!pathname || pathname === '/') {
    return pathname;
  }

  return pathname
    .replace(/^(\/zh)+(?=\/)/, '/zh')
    .replace(/^(\/en)+(?=\/)/, '/en');
}

function switchLocalePath(pathname, locale, defaultLocale) {
  const normalizedPath = normalizeLocalePath(pathname || '/');
  const withoutLocale =
    normalizedPath.replace(/^\/(zh|en)(?=\/|$)/, '') || '/';

  if (locale === defaultLocale) {
    return withoutLocale;
  }

  if (withoutLocale === '/') {
    return `/${locale}`;
  }

  return `/${locale}${withoutLocale}`;
}

export default function LocaleDropdownNavbarItem({
  mobile,
  dropdownItemsBefore,
  dropdownItemsAfter,
  queryString = '',
  ...props
}) {
  const {
    i18n: {currentLocale, defaultLocale, locales, localeConfigs},
  } = useDocusaurusContext();
  const {pathname, search, hash} = useLocation();
  const normalizedCurrentPath = normalizeLocalePath(pathname);

  const localeItems = locales.map((locale) => {
    const targetPath =
      locale === currentLocale
        ? normalizedCurrentPath
        : switchLocalePath(normalizedCurrentPath, locale, defaultLocale);
    const to = `pathname://${targetPath}${search}${hash}${queryString}`;

    return {
      label: localeConfigs[locale].label,
      lang: localeConfigs[locale].htmlLang,
      to,
      target: '_self',
      autoAddBaseUrl: false,
      className:
        locale === currentLocale
          ? mobile
            ? 'menu__link--active'
            : 'dropdown__link--active'
          : '',
    };
  });

  const items = [...dropdownItemsBefore, ...localeItems, ...dropdownItemsAfter];

  const dropdownLabel = mobile
    ? translate({
        message: 'Languages',
        id: 'theme.navbar.mobileLanguageDropdown.label',
        description: 'The label for the mobile language switcher dropdown',
      })
    : localeConfigs[currentLocale].label;

  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      label={
        <>
          <IconLanguage className={styles.iconLanguage} />
          {dropdownLabel}
        </>
      }
      items={items}
    />
  );
}
