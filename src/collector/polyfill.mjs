(function () {
  let $i8n = function (key, val, nameSpace) {
    const langPackage = $i8n[nameSpace] ? $i8n[nameSpace] : $i8n.package
    return (langPackage || {})[key] || val;
  };
  let $$i8n = function (val) {
    return val;
  };
  // $i8n.package = {};
  $i8n.version = "${i18n_locale_language_version}";
  $i8n.locale = function (locale, nameSpace) {
    if (nameSpace) {
      $i8n[nameSpace] = locale || {};
    } else {
      $i8n.package = locale || {};
    }
  };
  window.$i8n = $i8n;
  window.$$i8n = $$i8n;
})();
