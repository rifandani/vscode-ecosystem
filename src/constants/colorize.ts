/**
 * based on csswg/css-color
 *
 * @link http://dev.w3.org/csswg/css-color/#named-colors
 */
export const colorNames = [
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
]

/**
 * regex to catch valid hex, rgb, rgba, hsl, display-p3, lch, oklab, and hwb color strings
 *
 * NOTE: it needs "g" flags to works when we `exec` and loop thru its array. could also combine it with "i" flag.
 */
export const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/gi
export const rgbRegex = /rgb\(\s*\d+\s*(?:,\s*\d+\s*){0,2}(?:\s*\/\s*(?:\d+\.?\d*|\.\d+))?\)/gi
export const rgbaRegex = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:\d+\.?\d*|\.\d+)\s*\)/gi
export const hslRegex = /hsl\(\s*(\d+(\.\d+)?)deg,\s*(\d+(\.\d+)?)%,\s*(\d+(\.\d+)?)%\s*\)/gi
export const displayP3Regex = /color\(display-p3\s*(?:\d+(\.\d+)?)\s+(?:\d+(\.\d+)?)\s+(?:\d+(\.\d+)?)\)/gi
export const lchRegex = /lch\(\s*(?:\d+(\.\d+)?%?\s+){1,2}\d+(\.\d+)?\s+\d+(\.\d+)?\)/gi
export const oklabRegex = /oklab\(\s*\d+(\.\d+)?%\s+\d+(\.\d+)\s+\d+(\.\d+)\)/gi
export const hwbRegex = /hwb\(\s*(\d+(\.\d+)?)\s*(?:%|\s+)(\d+(\.\d+)?)%\s*(?:%|\s+)(\d+(\.\d+)?)%\)/gi

/**
 * Combined regex pattern for all color types
 *
 * NOTE:
 *
 * rgb\(\s*\d+\s*(?:,\s*\d+\s*){0,2}(?:\s*\/\s*(?:\d+\.?\d*|\.\d+))?\) -> will match will match "rgb(100, 0, 0)" but not "rgb(255 0 0 / 0.5)"
 * rgb\(\s*\d+(\s+\d+){0,2}(?:\s*\/\s*(?:\d+\.?\d*|\.\d+))?\) -> will match "rgb(255 0 0 / 0.5)" but not "rgb(100, 0, 0)"
 *
 * @example
 *
 * // #fff is hex, #000000 is hex, #FFF000 is also hex
 * // rgb(100, 0, 0) is rgb, hsl(217deg, 90%, 61%) is hsl
 * // rgb(255 0 0 / 0.5) or rgba(255, 0, 0, 0.5) is rgba
 * // color(display-p3 1 1 0) is display p-3, lch(55% 132 95) is lch
 * // oklab(59% 0.1 0.1) is oklab, hwb(194 50% 20%) is hwb
 */
export const colorsRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b|rgb\(\s*\d+\s*(?:,\s*\d+\s*){0,2}(?:\s*\/\s*(?:\d+\.?\d*|\.\d+))?\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:\d+\.?\d*|\.\d+)\s*\)|hsl\(\s*(\d+(\.\d+)?)deg,\s*(\d+(\.\d+)?)%,\s*(\d+(\.\d+)?)%\s*\)|lch\(\s*(?:\d+(\.\d+)?%?\s+){1,2}\d+(\.\d+)?\s+\d+(\.\d+)?\)|color\(display-p3\s*(?:\d+(\.\d+)?)\s+(?:\d+(\.\d+)?)\s+(?:\d+(\.\d+)?)\)|oklab\(\s*\d+(\.\d+)?%\s+\d+(\.\d+)\s+\d+(\.\d+)\)|hwb\(\s*(\d+(\.\d+)?)\s*(?:%|\s+)(\d+(\.\d+)?)%\s*(?:%|\s+)(\d+(\.\d+)?)%\)/ig
