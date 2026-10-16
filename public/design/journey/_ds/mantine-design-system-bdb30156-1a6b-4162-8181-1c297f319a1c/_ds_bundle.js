/* @ds-bundle: {"format":3,"namespace":"MantineDesignSystem_bdb301","components":[{"name":"ActionIcon","sourcePath":"components/buttons/ActionIcon.jsx"},{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"CardSection","sourcePath":"components/data-display/Card.jsx"},{"name":"Paper","sourcePath":"components/data-display/Paper.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Checkbox","sourcePath":"components/inputs/Checkbox.jsx"},{"name":"Radio","sourcePath":"components/inputs/Radio.jsx"},{"name":"Switch","sourcePath":"components/inputs/Switch.jsx"},{"name":"TextInput","sourcePath":"components/inputs/TextInput.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/buttons/ActionIcon.jsx":"a6acfe8c895d","components/buttons/Button.jsx":"76881f1d8f6a","components/data-display/Avatar.jsx":"38cf52559ebf","components/data-display/Badge.jsx":"6a308365d91c","components/data-display/Card.jsx":"c8790fe85f46","components/data-display/Paper.jsx":"94968b17e909","components/feedback/Alert.jsx":"5ad2b923d8fd","components/inputs/Checkbox.jsx":"59d9bb75d809","components/inputs/Radio.jsx":"1f3f32521473","components/inputs/Switch.jsx":"ffa65e035b7e","components/inputs/TextInput.jsx":"e9bffb824198","components/navigation/Tabs.jsx":"8a13c89b996b","ui_kits/dashboard/DashboardView.jsx":"7cde604e892c","ui_kits/dashboard/Header.jsx":"4c2f403f825e","ui_kits/dashboard/Navbar.jsx":"d95c99dc362f","ui_kits/dashboard/SettingsView.jsx":"dc8d396aedaf"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MantineDesignSystem_bdb301 = window.MantineDesignSystem_bdb301 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/ActionIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  xs: 30,
  sm: 36,
  md: 42,
  lg: 50,
  xl: 60
};
function resolveVariant(variant, color) {
  switch (variant) {
    case 'light':
      return {
        background: `var(--mantine-color-${color}-light)`,
        color: `var(--mantine-color-${color}-light-color)`,
        border: '1px solid transparent',
        hoverBg: `var(--mantine-color-${color}-light-hover)`
      };
    case 'outline':
      return {
        background: 'transparent',
        color: `var(--mantine-color-${color}-filled)`,
        border: `1px solid var(--mantine-color-${color}-filled)`,
        hoverBg: `var(--mantine-color-${color}-light)`
      };
    case 'subtle':
      return {
        background: 'transparent',
        color: `var(--mantine-color-${color}-light-color)`,
        border: '1px solid transparent',
        hoverBg: `var(--mantine-color-${color}-light-hover)`
      };
    case 'transparent':
      return {
        background: 'transparent',
        color: `var(--mantine-color-${color}-light-color)`,
        border: '1px solid transparent',
        hoverBg: 'transparent'
      };
    case 'default':
      return {
        background: 'var(--mantine-color-default)',
        color: 'var(--mantine-color-default-color)',
        border: '1px solid var(--mantine-color-default-border)',
        hoverBg: 'var(--mantine-color-default-hover)'
      };
    case 'filled':
    default:
      return {
        background: `var(--mantine-color-${color}-filled)`,
        color: 'var(--mantine-color-white)',
        border: '1px solid transparent',
        hoverBg: `var(--mantine-color-${color}-filled-hover)`
      };
  }
}
function ActionIcon({
  children,
  variant = 'filled',
  color = 'blue',
  size = 'md',
  radius = 'md',
  disabled = false,
  style,
  ...others
}) {
  const [hover, setHover] = React.useState(false);
  const dim = typeof size === 'number' ? size : SIZES[size] || SIZES.md;
  const v = resolveVariant(variant, color);
  const root = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dim,
    height: dim,
    borderRadius: `var(--mantine-radius-${radius}, ${radius})`,
    border: v.border,
    background: disabled ? 'var(--mantine-color-disabled)' : hover ? v.hoverBg : v.background,
    color: disabled ? 'var(--mantine-color-disabled-color)' : v.color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 150ms ease, color 150ms ease',
    padding: 0,
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: root
  }, others), children);
}
Object.assign(__ds_scope, { ActionIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/ActionIcon.jsx", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  xs: {
    height: 30,
    padding: 14,
    fz: 'var(--mantine-font-size-xs)'
  },
  sm: {
    height: 36,
    padding: 18,
    fz: 'var(--mantine-font-size-sm)'
  },
  md: {
    height: 42,
    padding: 22,
    fz: 'var(--mantine-font-size-md)'
  },
  lg: {
    height: 50,
    padding: 26,
    fz: 'var(--mantine-font-size-lg)'
  },
  xl: {
    height: 60,
    padding: 32,
    fz: 'var(--mantine-font-size-xl)'
  }
};
const COMPACT = {
  xs: {
    height: 22,
    padding: 7
  },
  sm: {
    height: 26,
    padding: 8
  },
  md: {
    height: 30,
    padding: 10
  },
  lg: {
    height: 34,
    padding: 12
  },
  xl: {
    height: 40,
    padding: 14
  }
};

// Resolve background / color / border / hover for a (variant, color) pair.
function resolveVariant(variant, color) {
  const filled = `var(--mantine-color-${color}-filled)`;
  const filledHover = `var(--mantine-color-${color}-filled-hover)`;
  switch (variant) {
    case 'light':
      return {
        background: `var(--mantine-color-${color}-light)`,
        color: `var(--mantine-color-${color}-light-color)`,
        border: '1px solid transparent',
        hoverBg: `var(--mantine-color-${color}-light-hover)`
      };
    case 'outline':
      return {
        background: 'transparent',
        color: `var(--mantine-color-${color}-outline, var(--mantine-color-${color}-filled))`,
        border: `1px solid var(--mantine-color-${color}-outline, var(--mantine-color-${color}-filled))`,
        hoverBg: `var(--mantine-color-${color}-outline-hover, var(--mantine-color-${color}-light))`
      };
    case 'subtle':
      return {
        background: 'transparent',
        color: `var(--mantine-color-${color}-light-color)`,
        border: '1px solid transparent',
        hoverBg: `var(--mantine-color-${color}-light-hover)`
      };
    case 'transparent':
      return {
        background: 'transparent',
        color: `var(--mantine-color-${color}-light-color)`,
        border: '1px solid transparent',
        hoverBg: 'transparent'
      };
    case 'white':
      return {
        background: 'var(--mantine-color-white)',
        color: filled,
        border: '1px solid transparent',
        hoverBg: 'var(--mantine-color-gray-0)'
      };
    case 'default':
      return {
        background: 'var(--mantine-color-default)',
        color: 'var(--mantine-color-default-color)',
        border: '1px solid var(--mantine-color-default-border)',
        hoverBg: 'var(--mantine-color-default-hover)'
      };
    case 'gradient':
      return {
        background: 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-cyan-5))',
        color: 'var(--mantine-color-white)',
        border: 'none',
        hoverBg: 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-cyan-5))'
      };
    case 'filled':
    default:
      return {
        background: filled,
        color: 'var(--mantine-color-white)',
        border: '1px solid transparent',
        hoverBg: filledHover
      };
  }
}
function Button({
  children,
  variant = 'filled',
  color = 'blue',
  size = 'sm',
  radius = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftSection,
  rightSection,
  style,
  ...others
}) {
  const [hover, setHover] = React.useState(false);
  const compact = typeof size === 'string' && size.startsWith('compact-');
  const baseSize = compact ? size.replace('compact-', '') : size;
  const s = SIZES[baseSize] || SIZES.sm;
  const c = compact ? COMPACT[baseSize] || COMPACT.sm : null;
  const v = resolveVariant(variant, color);
  const isDisabled = disabled || loading;
  const radiusVal = `var(--mantine-radius-${radius}, ${radius})`;
  const root = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--mantine-spacing-xs)',
    height: c ? c.height : s.height,
    paddingInline: c ? c.padding : s.padding,
    fontSize: s.fz,
    fontWeight: 'var(--mantine-font-weight-medium)',
    fontFamily: 'var(--mantine-font-family)',
    lineHeight: 1,
    borderRadius: radiusVal,
    border: v.border,
    background: isDisabled ? 'var(--mantine-color-disabled)' : hover ? v.hoverBg : v.background,
    color: isDisabled ? 'var(--mantine-color-disabled-color)' : v.color,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    transition: 'background-color 150ms ease, color 150ms ease',
    whiteSpace: 'nowrap',
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: isDisabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: root
  }, others), loading && /*#__PURE__*/React.createElement(Spinner, null), !loading && leftSection ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center'
    }
  }, leftSection) : null, /*#__PURE__*/React.createElement("span", null, children), !loading && rightSection ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center'
    }
  }, rightSection) : null);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'mantine-btn-spin 0.8s linear infinite'
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes mantine-btn-spin { to { transform: rotate(360deg); } }`));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  xs: 16,
  sm: 26,
  md: 38,
  lg: 56,
  xl: 84
};
function Avatar({
  src,
  alt,
  children,
  size = 'md',
  radius = '100%',
  color = 'gray',
  variant = 'light',
  style,
  ...others
}) {
  const dim = typeof size === 'number' ? size : SIZES[size] || SIZES.md;
  const r = radius === '100%' ? '50%' : `var(--mantine-radius-${radius}, ${radius})`;
  let bg = 'var(--mantine-color-gray-1)';
  let fg = 'var(--mantine-color-dimmed)';
  if (variant === 'filled') {
    bg = `var(--mantine-color-${color}-filled)`;
    fg = 'var(--mantine-color-white)';
  } else if (variant === 'light') {
    bg = `var(--mantine-color-${color}-light)`;
    fg = `var(--mantine-color-${color}-light-color)`;
  } else if (variant === 'outline') {
    bg = 'transparent';
    fg = `var(--mantine-color-${color}-filled)`;
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: dim,
      height: dim,
      borderRadius: r,
      overflow: 'hidden',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: src ? 'var(--mantine-color-gray-1)' : bg,
      color: fg,
      border: variant === 'outline' ? `1px solid var(--mantine-color-${color}-filled)` : 'none',
      fontFamily: 'var(--mantine-font-family)',
      fontSize: dim * 0.4,
      fontWeight: 600,
      flexShrink: 0,
      ...style
    }
  }, others), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : children);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const HEIGHTS = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 26,
  xl: 32
};
const FONTS = {
  xs: 9,
  sm: 10,
  md: 11,
  lg: 13,
  xl: 16
};
function variantStyles(variant, color) {
  switch (variant) {
    case 'light':
      return {
        background: `var(--mantine-color-${color}-light)`,
        color: `var(--mantine-color-${color}-light-color)`,
        border: '1px solid transparent'
      };
    case 'outline':
      return {
        background: 'transparent',
        color: `var(--mantine-color-${color}-filled)`,
        border: `1px solid var(--mantine-color-${color}-filled)`
      };
    case 'dot':
      return {
        background: 'var(--mantine-color-default)',
        color: 'var(--mantine-color-default-color)',
        border: '1px solid var(--mantine-color-default-border)',
        dot: true
      };
    case 'gradient':
      return {
        background: 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-cyan-5))',
        color: 'var(--mantine-color-white)',
        border: 'none'
      };
    case 'default':
      return {
        background: 'var(--mantine-color-default)',
        color: 'var(--mantine-color-default-color)',
        border: '1px solid var(--mantine-color-default-border)'
      };
    case 'filled':
    default:
      return {
        background: `var(--mantine-color-${color}-filled)`,
        color: 'var(--mantine-color-white)',
        border: '1px solid transparent'
      };
  }
}
function Badge({
  children,
  variant = 'filled',
  color = 'blue',
  size = 'md',
  radius = 'xl',
  leftSection,
  rightSection,
  style,
  ...others
}) {
  const h = HEIGHTS[size] || HEIGHTS.md;
  const fz = FONTS[size] || FONTS.md;
  const v = variantStyles(variant, color);
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: h,
      paddingInline: Math.round(h * 0.5),
      fontSize: fz,
      fontWeight: 700,
      letterSpacing: 0.25,
      textTransform: 'uppercase',
      lineHeight: 1,
      fontFamily: 'var(--mantine-font-family)',
      borderRadius: `var(--mantine-radius-${radius}, ${radius})`,
      background: v.background,
      color: v.color,
      border: v.border,
      whiteSpace: 'nowrap',
      ...style
    }
  }, others), v.dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: `var(--mantine-color-${color}-filled)`
    }
  }), leftSection, children, rightSection);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Paper.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SHADOWS = {
  xs: 'var(--mantine-shadow-xs)',
  sm: 'var(--mantine-shadow-sm)',
  md: 'var(--mantine-shadow-md)',
  lg: 'var(--mantine-shadow-lg)',
  xl: 'var(--mantine-shadow-xl)'
};
function Paper({
  children,
  shadow,
  radius = 'md',
  withBorder = false,
  p = 'md',
  style,
  ...others
}) {
  const padding = ['xs', 'sm', 'md', 'lg', 'xl'].includes(p) ? `var(--mantine-spacing-${p})` : p;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--mantine-color-body)',
      borderRadius: `var(--mantine-radius-${radius}, ${radius})`,
      boxShadow: shadow ? SHADOWS[shadow] || shadow : 'none',
      border: withBorder ? '1px solid var(--mantine-color-gray-3)' : 'none',
      padding,
      fontFamily: 'var(--mantine-font-family)',
      color: 'var(--mantine-color-text)',
      ...style
    }
  }, others), children);
}
Object.assign(__ds_scope, { Paper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Paper.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  shadow,
  radius = 'md',
  withBorder = false,
  padding = 'md',
  style,
  ...others
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Paper, _extends({
    shadow: shadow,
    radius: radius,
    withBorder: withBorder,
    p: 0,
    style: {
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, others), /*#__PURE__*/React.createElement("div", {
    "data-card-padding": padding,
    style: {
      display: 'contents'
    }
  }, React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type && child.type.__isCardSection) {
      return child;
    }
    const pad = ['xs', 'sm', 'md', 'lg', 'xl'].includes(padding) ? `var(--mantine-spacing-${padding})` : padding;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        paddingInline: pad,
        paddingBlock: 'calc(' + pad + ' / 2)'
      }
    }, child);
  })));
}
function CardSection({
  children,
  withBorder = false,
  inheritPadding = false,
  padding = 'md',
  style,
  ...others
}) {
  const pad = ['xs', 'sm', 'md', 'lg', 'xl'].includes(padding) ? `var(--mantine-spacing-${padding})` : padding;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderBottom: withBorder ? '1px solid var(--mantine-color-gray-3)' : undefined,
      borderTop: withBorder ? '1px solid var(--mantine-color-gray-3)' : undefined,
      paddingInline: inheritPadding ? pad : 0,
      ...style
    }
  }, others), children);
}
CardSection.__isCardSection = true;
Card.Section = CardSection;
Object.assign(__ds_scope, { Card, CardSection });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const VARIANTS = {
  light: color => ({
    background: `var(--mantine-color-${color}-light)`,
    color: `var(--mantine-color-${color}-light-color)`,
    border: '1px solid transparent',
    title: `var(--mantine-color-${color}-light-color)`
  }),
  filled: color => ({
    background: `var(--mantine-color-${color}-filled)`,
    color: 'var(--mantine-color-white)',
    border: '1px solid transparent',
    title: 'var(--mantine-color-white)'
  }),
  outline: color => ({
    background: 'transparent',
    color: 'var(--mantine-color-text)',
    border: `1px solid var(--mantine-color-${color}-filled)`,
    title: `var(--mantine-color-${color}-filled)`
  }),
  default: color => ({
    background: 'var(--mantine-color-body)',
    color: 'var(--mantine-color-text)',
    border: '1px solid var(--mantine-color-gray-3)',
    title: `var(--mantine-color-${color}-filled)`
  })
};
function Alert({
  children,
  title,
  color = 'blue',
  variant = 'light',
  icon,
  withCloseButton = false,
  onClose,
  radius = 'md',
  style,
  ...others
}) {
  const v = (VARIANTS[variant] || VARIANTS.light)(color);
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "alert",
    style: {
      display: 'flex',
      gap: 'var(--mantine-spacing-sm)',
      padding: 'var(--mantine-spacing-md)',
      borderRadius: `var(--mantine-radius-${radius}, ${radius})`,
      background: v.background,
      color: v.color,
      border: v.border,
      fontFamily: 'var(--mantine-font-family)',
      ...style
    }
  }, others), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      color: v.title,
      lineHeight: 0,
      marginTop: 1
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 'var(--mantine-font-size-sm)',
      color: v.title,
      marginBottom: 4
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--mantine-font-size-sm)',
      lineHeight: 1.45
    }
  }, children)), withCloseButton && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'inherit',
      opacity: 0.7,
      padding: 2,
      lineHeight: 0,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6L6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  color = 'blue',
  size = 'sm',
  radius = 'sm',
  indeterminate = false,
  style,
  ...others
}) {
  const dims = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 30,
    xl: 36
  };
  const box = dims[size] || dims.sm;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const on = isControlled ? checked : internal;
  const handle = e => {
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };
  const active = on || indeterminate;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 'var(--mantine-spacing-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--mantine-font-family)',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      flexShrink: 0,
      marginTop: description ? 2 : 0
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: on,
    onChange: handle,
    disabled: disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: box,
      height: box,
      margin: 0,
      cursor: 'inherit'
    }
  }, others)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: box,
      height: box,
      borderRadius: `var(--mantine-radius-${radius}, ${radius})`,
      border: active ? `1px solid var(--mantine-color-${color}-filled)` : '1px solid var(--mantine-color-gray-4)',
      background: active ? `var(--mantine-color-${color}-filled)` : 'var(--mantine-color-white)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 100ms ease, border-color 100ms ease'
    }
  }, indeterminate ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: box * 0.5,
      height: 2,
      background: 'var(--mantine-color-white)',
      borderRadius: 2
    }
  }) : on ? /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 10 7",
    width: box * 0.6,
    height: box * 0.42,
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 3.5L3.5 6L9 1",
    stroke: "white",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })) : null)), (label || description) && /*#__PURE__*/React.createElement("span", null, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--mantine-font-size-sm)',
      color: 'var(--mantine-color-text)',
      lineHeight: 1.3
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'calc(var(--mantine-font-size-sm) - 2px)',
      color: 'var(--mantine-color-dimmed)',
      lineHeight: 1.3,
      marginTop: 2
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Radio({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  name,
  value,
  disabled = false,
  color = 'blue',
  size = 'sm',
  style,
  ...others
}) {
  const dims = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 30,
    xl: 36
  };
  const box = dims[size] || dims.sm;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const on = isControlled ? checked : internal;
  const handle = e => {
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 'var(--mantine-spacing-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--mantine-font-family)',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      flexShrink: 0,
      marginTop: description ? 2 : 0
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    name: name,
    value: value,
    checked: on,
    onChange: handle,
    disabled: disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: box,
      height: box,
      margin: 0,
      cursor: 'inherit'
    }
  }, others)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: box,
      height: box,
      borderRadius: '50%',
      border: on ? `${Math.max(4, box * 0.28)}px solid var(--mantine-color-${color}-filled)` : '1px solid var(--mantine-color-gray-4)',
      background: 'var(--mantine-color-white)',
      transition: 'border 120ms ease',
      boxSizing: 'border-box'
    }
  })), (label || description) && /*#__PURE__*/React.createElement("span", null, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--mantine-font-size-sm)',
      color: 'var(--mantine-color-text)',
      lineHeight: 1.3
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'calc(var(--mantine-font-size-sm) - 2px)',
      color: 'var(--mantine-color-dimmed)',
      lineHeight: 1.3,
      marginTop: 2
    }
  }, description)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Radio.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  color = 'blue',
  size = 'sm',
  style,
  ...others
}) {
  const sizes = {
    xs: {
      w: 32,
      h: 16,
      knob: 12
    },
    sm: {
      w: 38,
      h: 20,
      knob: 16
    },
    md: {
      w: 46,
      h: 24,
      knob: 18
    },
    lg: {
      w: 56,
      h: 32,
      knob: 24
    },
    xl: {
      w: 72,
      h: 40,
      knob: 32
    }
  };
  const sz = sizes[size] || sizes.sm;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const on = isControlled ? checked : internal;
  const handle = e => {
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 'var(--mantine-spacing-sm)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--mantine-font-family)',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: on,
    onChange: handle,
    disabled: disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, others)), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      flexShrink: 0,
      width: sz.w,
      height: sz.h,
      borderRadius: sz.h,
      background: on ? `var(--mantine-color-${color}-filled)` : 'var(--mantine-color-gray-2)',
      transition: 'background-color 150ms ease'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: (sz.h - sz.knob) / 2,
      left: on ? sz.w - sz.knob - (sz.h - sz.knob) / 2 : (sz.h - sz.knob) / 2,
      width: sz.knob,
      height: sz.knob,
      borderRadius: '50%',
      background: 'var(--mantine-color-white)',
      transition: 'left 150ms ease',
      boxShadow: 'var(--mantine-shadow-xs)'
    }
  })), (label || description) && /*#__PURE__*/React.createElement("span", null, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--mantine-font-size-sm)',
      color: 'var(--mantine-color-text)',
      lineHeight: 1.3
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'calc(var(--mantine-font-size-sm) - 2px)',
      color: 'var(--mantine-color-dimmed)',
      lineHeight: 1.3,
      marginTop: 2
    }
  }, description)));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Switch.jsx", error: String((e && e.message) || e) }); }

// components/inputs/TextInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const HEIGHTS = {
  xs: 30,
  sm: 36,
  md: 42,
  lg: 50,
  xl: 60
};
function TextInput({
  label,
  description,
  placeholder,
  error,
  required = false,
  disabled = false,
  withAsterisk,
  size = 'sm',
  radius = 'sm',
  variant = 'default',
  leftSection,
  rightSection,
  value,
  defaultValue,
  onChange,
  style,
  ...others
}) {
  const [focused, setFocused] = React.useState(false);
  const height = HEIGHTS[size] || HEIGHTS.sm;
  const pad = Math.round(height / 3);
  const showAsterisk = withAsterisk ?? required;
  const bg = variant === 'filled' ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-white)';
  let borderColor = variant === 'filled' ? 'transparent' : 'var(--mantine-color-gray-4)';
  if (focused) borderColor = 'var(--mantine-primary-color-filled)';
  if (error) borderColor = 'var(--mantine-color-error)';
  const fieldStyle = {
    width: '100%',
    height,
    fontFamily: 'var(--mantine-font-family)',
    fontSize: 'var(--mantine-font-size-md)',
    color: 'var(--mantine-color-text)',
    background: disabled ? 'var(--mantine-color-disabled)' : bg,
    border: `1px solid ${borderColor}`,
    borderRadius: `var(--mantine-radius-${radius}, ${radius})`,
    paddingInlineStart: leftSection ? height - 2 : pad,
    paddingInlineEnd: rightSection ? height - 2 : pad,
    outline: 'none',
    transition: 'border-color 100ms ease',
    cursor: disabled ? 'not-allowed' : 'text',
    boxSizing: 'border-box'
  };
  const sectionStyle = side => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    [side]: 0,
    width: height - 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: error ? 'var(--mantine-color-error)' : 'var(--mantine-color-dimmed)',
    pointerEvents: 'none'
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--mantine-font-family)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-block',
      fontSize: 'var(--mantine-font-size-sm)',
      fontWeight: 'var(--mantine-font-weight-medium)',
      color: 'var(--mantine-color-text)',
      marginBottom: 1
    }
  }, label, showAsterisk && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--mantine-color-error)'
    }
  }, " *")), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'calc(var(--mantine-font-size-sm) - 2px)',
      color: 'var(--mantine-color-dimmed)',
      lineHeight: 1.2,
      marginBottom: 4
    }
  }, description), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginTop: label || description ? 4 : 0
    }
  }, leftSection && /*#__PURE__*/React.createElement("div", {
    style: sectionStyle('left')
  }, leftSection), /*#__PURE__*/React.createElement("input", _extends({
    type: "text",
    placeholder: placeholder,
    disabled: disabled,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: fieldStyle
  }, others)), rightSection && /*#__PURE__*/React.createElement("div", {
    style: sectionStyle('right')
  }, rightSection)), error && typeof error !== 'boolean' && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'calc(var(--mantine-font-size-sm) - 2px)',
      color: 'var(--mantine-color-error)',
      lineHeight: 1.2,
      marginTop: 4
    }
  }, error));
}
Object.assign(__ds_scope, { TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tabs({
  children,
  value,
  defaultValue,
  onChange,
  variant = 'default',
  color = 'blue',
  style,
  ...others
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const active = isControlled ? value : internal;
  const setActive = v => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };
  const ctx = {
    active,
    setActive,
    variant,
    color
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      fontFamily: 'var(--mantine-font-family)',
      ...style
    }
  }, others), React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, {
    __tabsCtx: ctx
  }) : child));
}
function List({
  children,
  __tabsCtx,
  grow = false,
  style
}) {
  const isPills = __tabsCtx?.variant === 'pills';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: isPills ? 8 : 0,
      borderBottom: isPills ? 'none' : '1px solid var(--mantine-color-gray-3)',
      ...style
    }
  }, React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, {
    __tabsCtx,
    grow
  }) : child));
}
function Tab({
  children,
  value,
  leftSection,
  rightSection,
  __tabsCtx,
  grow,
  disabled = false
}) {
  const {
    active,
    setActive,
    variant,
    color
  } = __tabsCtx || {};
  const isActive = active === value;
  const [hover, setHover] = React.useState(false);
  const isPills = variant === 'pills';
  let s;
  if (isPills) {
    s = {
      borderRadius: 'var(--mantine-radius-sm)',
      background: isActive ? `var(--mantine-color-${color}-filled)` : hover ? 'var(--mantine-color-gray-1)' : 'transparent',
      color: isActive ? 'var(--mantine-color-white)' : 'var(--mantine-color-text)',
      border: 'none'
    };
  } else {
    s = {
      borderBottom: isActive ? `2px solid var(--mantine-color-${color}-filled)` : '2px solid transparent',
      marginBottom: -1,
      background: hover && !isActive ? 'var(--mantine-color-gray-0)' : 'transparent',
      color: isActive ? 'var(--mantine-color-text)' : 'var(--mantine-color-dimmed)',
      fontWeight: isActive ? 600 : 400,
      borderRadius: 'var(--mantine-radius-sm) var(--mantine-radius-sm) 0 0'
    };
  }
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    onClick: () => setActive(value),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      flex: grow ? 1 : 'initial',
      padding: '9px 16px',
      fontSize: 'var(--mantine-font-size-sm)',
      fontFamily: 'inherit',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background-color 120ms ease, color 120ms ease',
      ...s
    }
  }, leftSection && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      lineHeight: 0
    }
  }, leftSection), children, rightSection && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      lineHeight: 0
    }
  }, rightSection));
}
function Panel({
  children,
  value,
  __tabsCtx
}) {
  if (__tabsCtx?.active !== value) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 'var(--mantine-spacing-md)'
    }
  }, children);
}
Tabs.List = List;
Tabs.Tab = Tab;
Tabs.Panel = Panel;
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/DashboardView.jsx
try { (() => {
// DashboardView — stats, projects table, activity feed.
function StatCard({
  label,
  value,
  diff,
  up,
  icon,
  color
}) {
  const {
    Paper
  } = window.MantineDesignSystem_bdb301;
  return /*#__PURE__*/React.createElement(Paper, {
    withBorder: true,
    radius: "md",
    p: "lg",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '.5px',
      fontWeight: 700,
      color: 'var(--mantine-color-dimmed)'
    }
  }, label), /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 22,
      color: `var(--mantine-color-${color}-6)`
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      lineHeight: 1
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      fontSize: 13,
      fontWeight: 600,
      color: up ? 'var(--mantine-color-teal-7)' : 'var(--mantine-color-red-6)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-arrow-${up ? 'up-right' : 'down-right'}`
  }), diff)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--mantine-color-dimmed)',
      marginTop: 6
    }
  }, "compared to last month"));
}
const PROJECTS = [{
  name: 'Design system v8',
  client: 'Internal',
  status: 'active',
  progress: 78,
  color: 'teal'
}, {
  name: 'Marketing website',
  client: 'Acme Inc.',
  status: 'active',
  progress: 54,
  color: 'blue'
}, {
  name: 'Mobile onboarding',
  client: 'Fjord Tours',
  status: 'review',
  progress: 92,
  color: 'grape'
}, {
  name: 'Analytics dashboard',
  client: 'Northwind',
  status: 'paused',
  progress: 30,
  color: 'orange'
}, {
  name: 'Q3 brand refresh',
  client: 'Internal',
  status: 'active',
  progress: 12,
  color: 'blue'
}];
const STATUS = {
  active: {
    color: 'teal',
    label: 'Active'
  },
  review: {
    color: 'blue',
    label: 'In review'
  },
  paused: {
    color: 'gray',
    label: 'Paused'
  }
};
function ProjectsTable() {
  const {
    Paper,
    Badge,
    Avatar
  } = window.MantineDesignSystem_bdb301;
  return /*#__PURE__*/React.createElement(Paper, {
    withBorder: true,
    radius: "md",
    style: {
      flex: 2,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--mantine-spacing-md) var(--mantine-spacing-lg)',
      borderBottom: '1px solid var(--mantine-color-gray-2)'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontSize: 16
    }
  }, "Active projects"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "View all")), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      textAlign: 'left',
      color: 'var(--mantine-color-dimmed)',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '.5px'
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '10px 20px',
      fontWeight: 700
    }
  }, "Project"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '10px 20px',
      fontWeight: 700
    }
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '10px 20px',
      fontWeight: 700,
      width: 200
    }
  }, "Progress"))), /*#__PURE__*/React.createElement("tbody", null, PROJECTS.map((p, i) => /*#__PURE__*/React.createElement("tr", {
    key: p.name,
    style: {
      borderTop: '1px solid var(--mantine-color-gray-2)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    color: p.color,
    radius: "md",
    size: "md"
  }, p.name[0]), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--mantine-color-dimmed)'
    }
  }, p.client)))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 20px'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "light",
    color: STATUS[p.status].color
  }, STATUS[p.status].label)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 6,
      borderRadius: 6,
      background: 'var(--mantine-color-gray-2)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${p.progress}%`,
      height: '100%',
      background: `var(--mantine-color-${p.color}-6)`
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--mantine-color-dimmed)',
      width: 32
    }
  }, p.progress, "%"))))))));
}
const ACTIVITY = [{
  who: 'Ana Bell',
  what: 'merged a PR in Design system v8',
  time: '12m',
  color: 'grape',
  i: 'git-merge'
}, {
  who: 'Jon Diaz',
  what: 'commented on Mobile onboarding',
  time: '1h',
  color: 'blue',
  i: 'message'
}, {
  who: 'Mira Kapoor',
  what: 'completed 4 tasks',
  time: '3h',
  color: 'teal',
  i: 'circle-check'
}, {
  who: 'Acme Inc.',
  what: 'approved the website mockups',
  time: '5h',
  color: 'orange',
  i: 'thumb-up'
}];
function ActivityFeed() {
  const {
    Paper,
    Avatar
  } = window.MantineDesignSystem_bdb301;
  return /*#__PURE__*/React.createElement(Paper, {
    withBorder: true,
    radius: "md",
    p: "lg",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0 0 4px',
      fontSize: 16
    }
  }, "Recent activity"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginTop: 16
    }
  }, ACTIVITY.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    color: a.color,
    radius: "xl",
    size: "md"
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${a.i}`,
    style: {
      fontSize: 16
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, a.who), " ", a.what, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--mantine-color-dimmed)',
      marginTop: 2
    }
  }, a.time, " ago"))))));
}
function DashboardView() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--mantine-spacing-lg)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0
    }
  }, "Welcome back, Riley \uD83D\uDC4B"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      color: 'var(--mantine-color-dimmed)'
    }
  }, "Here's what's happening across your projects today.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--mantine-spacing-lg)'
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Revenue",
    value: "$48.2k",
    diff: "12.5%",
    up: true,
    icon: "currency-dollar",
    color: "teal"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Active projects",
    value: "18",
    diff: "3",
    up: true,
    icon: "folders",
    color: "blue"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Open tasks",
    value: "64",
    diff: "8%",
    up: false,
    icon: "checklist",
    color: "grape"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Team load",
    value: "82%",
    diff: "5%",
    up: true,
    icon: "users",
    color: "orange"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--mantine-spacing-lg)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(ProjectsTable, null), /*#__PURE__*/React.createElement(ActivityFeed, null)));
}
window.DashboardView = DashboardView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/DashboardView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Header.jsx
try { (() => {
// Header — top bar with page title, search, and actions.
function Header({
  title
}) {
  const {
    ActionIcon,
    TextInput,
    Button
  } = window.MantineDesignSystem_bdb301;
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 64,
      flexShrink: 0,
      boxSizing: 'border-box',
      borderBottom: '1px solid var(--mantine-color-gray-3)',
      background: 'var(--mantine-color-white)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 var(--mantine-spacing-xl)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 20
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      width: 280
    }
  }, /*#__PURE__*/React.createElement(TextInput, {
    placeholder: "Search\u2026",
    leftSection: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-search",
      style: {
        fontSize: 16
      }
    })
  })), /*#__PURE__*/React.createElement(ActionIcon, {
    variant: "default",
    size: "lg"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-bell",
    style: {
      fontSize: 18
    }
  })), /*#__PURE__*/React.createElement(ActionIcon, {
    variant: "default",
    size: "lg"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-moon",
    style: {
      fontSize: 18
    }
  })), /*#__PURE__*/React.createElement(Button, {
    leftSection: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-plus",
      style: {
        fontSize: 16
      }
    })
  }, "New project"));
}
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Navbar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Navbar — Mantine AppShell left navigation.
function NavLink({
  icon,
  label,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: '8px 12px',
      border: 'none',
      cursor: 'pointer',
      borderRadius: 'var(--mantine-radius-sm)',
      fontFamily: 'var(--mantine-font-family)',
      fontSize: 'var(--mantine-font-size-sm)',
      fontWeight: 500,
      textAlign: 'left',
      background: active ? 'var(--mantine-color-blue-light)' : hover ? 'var(--mantine-color-gray-0)' : 'transparent',
      color: active ? 'var(--mantine-color-blue-light-color)' : 'var(--mantine-color-gray-7)',
      transition: 'background-color 100ms ease'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 20
    }
  }), /*#__PURE__*/React.createElement("span", null, label));
}
function Navbar({
  active,
  onNavigate
}) {
  const main = [{
    id: 'dashboard',
    icon: 'layout-dashboard',
    label: 'Dashboard'
  }, {
    id: 'projects',
    icon: 'folders',
    label: 'Projects'
  }, {
    id: 'analytics',
    icon: 'chart-bar',
    label: 'Analytics'
  }, {
    id: 'team',
    icon: 'users',
    label: 'Team'
  }, {
    id: 'messages',
    icon: 'message-circle',
    label: 'Messages'
  }];
  const other = [{
    id: 'settings',
    icon: 'settings',
    label: 'Settings'
  }, {
    id: 'help',
    icon: 'help-circle',
    label: 'Help & support'
  }];
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      width: 260,
      flexShrink: 0,
      height: '100%',
      boxSizing: 'border-box',
      borderRight: '1px solid var(--mantine-color-gray-3)',
      background: 'var(--mantine-color-white)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--mantine-spacing-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '4px 8px 16px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/mantine-logo-icon.svg",
    alt: "",
    height: "30"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 20,
      letterSpacing: -0.5
    }
  }, "mantine")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, main.map(l => /*#__PURE__*/React.createElement(NavLink, _extends({
    key: l.id
  }, l, {
    active: active === l.id,
    onClick: () => onNavigate(l.id)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.5px',
      fontWeight: 700,
      color: 'var(--mantine-color-dimmed)',
      padding: '20px 12px 8px'
    }
  }, "Settings"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, other.map(l => /*#__PURE__*/React.createElement(NavLink, _extends({
    key: l.id
  }, l, {
    active: active === l.id,
    onClick: () => onNavigate(l.id)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 8,
      borderRadius: 'var(--mantine-radius-sm)',
      border: '1px solid var(--mantine-color-gray-2)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    color: "grape",
    radius: "xl",
    size: "md"
  }, "RW"), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "Riley Walker"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--mantine-color-dimmed)'
    }
  }, "riley@mantine.dev"))));
}
window.Navbar = Navbar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Navbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/SettingsView.jsx
try { (() => {
// SettingsView — profile + preferences form using form primitives.
function SettingsView() {
  const {
    Paper,
    TextInput,
    Switch,
    Button,
    Avatar,
    Tabs,
    Badge
  } = window.MantineDesignSystem_bdb301;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 4px'
    }
  }, "Settings"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 20px',
      color: 'var(--mantine-color-dimmed)'
    }
  }, "Manage your profile and workspace preferences."), /*#__PURE__*/React.createElement(Tabs, {
    defaultValue: "profile"
  }, /*#__PURE__*/React.createElement(Tabs.List, null, /*#__PURE__*/React.createElement(Tabs.Tab, {
    value: "profile",
    leftSection: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-user"
    })
  }, "Profile"), /*#__PURE__*/React.createElement(Tabs.Tab, {
    value: "notifications",
    leftSection: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-bell"
    })
  }, "Notifications"), /*#__PURE__*/React.createElement(Tabs.Tab, {
    value: "billing",
    leftSection: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-credit-card"
    })
  }, "Billing")), /*#__PURE__*/React.createElement(Tabs.Panel, {
    value: "profile"
  }, /*#__PURE__*/React.createElement(Paper, {
    withBorder: true,
    radius: "md",
    p: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    color: "grape",
    size: "xl",
    radius: "xl"
  }, "RW"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    variant: "default",
    size: "xs"
  }, "Change photo"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--mantine-color-dimmed)',
      marginTop: 6
    }
  }, "JPG or PNG. 1MB max."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(TextInput, {
    label: "First name",
    defaultValue: "Riley"
  }), /*#__PURE__*/React.createElement(TextInput, {
    label: "Last name",
    defaultValue: "Walker"
  }), /*#__PURE__*/React.createElement(TextInput, {
    label: "Email",
    defaultValue: "riley@mantine.dev",
    withAsterisk: true
  }), /*#__PURE__*/React.createElement(TextInput, {
    label: "Role",
    defaultValue: "Product Designer"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "default"
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, null, "Save changes")))), /*#__PURE__*/React.createElement(Tabs.Panel, {
    value: "notifications"
  }, /*#__PURE__*/React.createElement(Paper, {
    withBorder: true,
    radius: "md",
    p: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Email notifications",
    description: "Get notified about activity in your projects",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Push notifications",
    description: "Receive push alerts on mobile",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Weekly digest",
    description: "A summary of your week, every Monday"
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Marketing emails",
    description: "Product news and announcements",
    color: "grape"
  })))), /*#__PURE__*/React.createElement(Tabs.Panel, {
    value: "billing"
  }, /*#__PURE__*/React.createElement(Paper, {
    withBorder: true,
    radius: "md",
    p: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0
    }
  }, "Pro plan"), /*#__PURE__*/React.createElement(Badge, {
    color: "teal",
    variant: "light"
  }, "Current")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      color: 'var(--mantine-color-dimmed)',
      fontSize: 14
    }
  }, "$29 / month \xB7 renews Aug 1, 2026")), /*#__PURE__*/React.createElement(Button, {
    variant: "default"
  }, "Manage plan"))))));
}
window.SettingsView = SettingsView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/SettingsView.jsx", error: String((e && e.message) || e) }); }

__ds_ns.ActionIcon = __ds_scope.ActionIcon;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardSection = __ds_scope.CardSection;

__ds_ns.Paper = __ds_scope.Paper;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
