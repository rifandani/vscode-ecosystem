import ky from 'ky'

/**
 * with `prefixUrl: 'https://data.jsdelivr.com/v1/'`
 */
export const jsdelivrApi = ky.create({ prefixUrl: 'https://data.jsdelivr.com/v1/' })

/**
 * with `prefixUrl: 'https://api.npms.io/v2/'`
 *
 * possible endpoint: 'search/suggestions'
 *
 * @deprecated the api NOT frequently updated, use `npmRegistryApi` instead
 */
export const npmsApi = ky.create({ prefixUrl: `https://api.npms.io/v2/` })

/**
 * with `prefixUrl: 'https://registry.npmjs.com/-/v1/'`
 *
 * possible endpoint: 'search?size=30&from=0&text=vue'
 */
export const npmRegistryApi = ky.create({ prefixUrl: `https://registry.npmjs.com/-/v1/` })
