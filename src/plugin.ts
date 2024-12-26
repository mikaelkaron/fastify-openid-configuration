import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import {
  type OpenIDConfigurationOptions,
  openIDConfiguration
} from './configuration.js'

export type FastifyOpenIDConfigurationPluginOptions =
  OpenIDConfigurationOptions & {
    /**
     * Fastify decorator for OpenID configuration
     */
    decorator: string | symbol
  }

export const openIDConfigurationPlugin: FastifyPluginAsync<
  FastifyOpenIDConfigurationPluginOptions
> = async (fastify, { decorator, ...options }) => {
  const configuration = await openIDConfiguration.call(fastify, options)
  fastify.log.debug(configuration.serverMetadata(), 'OpenID server metadata')
  fastify.log.trace(
    `decorating \`fastify[${String(decorator)}]\` with OpenID configuration`
  )
  fastify.decorate(decorator, configuration)
}

export default fp(openIDConfigurationPlugin, {
  fastify: '5.x',
  name: 'fastify-openid-configuration'
})
