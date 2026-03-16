/**
 * 自定义 Footer 链接项：确保内部链接在双语环境下带正确的 locale 前缀，
 * 避免在英文等非默认语言下点击跳转到错误或 404 页面。
 */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';

export default function FooterLinkItem({item}) {
  const {to, href, label, prependBaseUrlToHref, className, ...props} = item;
  const {i18n} = useDocusaurusContext();
  const currentLocale = i18n?.currentLocale;
  const defaultLocale = i18n?.defaultLocale ?? 'zh';

  const toUrl = useBaseUrl(to);
  const normalizedHref = useBaseUrl(href, {forcePrependBaseUrl: true});

  // 内部链接：非默认语言时显式加上 locale 前缀，确保跳转到对应语言页面
  const internalTo =
    toUrl &&
    currentLocale &&
    currentLocale !== defaultLocale &&
    toUrl.startsWith('/') &&
    !toUrl.startsWith(`/${currentLocale}/`) &&
    !toUrl.startsWith(`/${currentLocale}`)
      ? `/${currentLocale}${toUrl}`
      : toUrl;

  return (
    <Link
      className={clsx('footer__link-item', className)}
      {...(href
        ? {
            href: prependBaseUrlToHref ? normalizedHref : href,
          }
        : {
            to: internalTo ?? toUrl,
          })}
      {...props}>
      {label}
      {href && !isInternalUrl(href) && <IconExternalLink />}
    </Link>
  );
}
