import ky from 'ky'

/**
 * with `prefixUrl: 'https://data.jsdelivr.com/v1/'`
 */
export const jsdelivrApi = ky.create({
  prefixUrl: 'https://data.jsdelivr.com/v1/',
})
