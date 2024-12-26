import retry, { type Options } from 'async-retry'
import type { FastifyInstance } from 'fastify'
import {
  type ClientAuth,
  type ClientMetadata,
  Configuration,
  type DiscoveryRequestOptions,
  type ServerMetadata,
  discovery
} from 'openid-client'

export type OpenIDConfigurationOptions =
  | {
      method: 'discover'
      /**
       * URL representation of the Authorization Server's Issuer Identifier
       */
      server: URL
      /**
       * Client Identifier at the Authorization Server
       */
      clientId: string
      /**
       * Client Metadata, when a string is passed in it is a shorthand for passing just {@link ClientMetadata.client_secret}
       */
      metadata?: Partial<ClientMetadata> | string
      /**
       * Implementation of the Client's Authentication Method at the Authorization Server.
       */
      clientAuthentication?: ClientAuth
      /**
       * Discovery request options
       */
      options?: DiscoveryRequestOptions
      /**
       * Retry options
       */
      retry?: Options
    }
  | {
      method: 'static'
      /**
       * Authorization Server Metadata
       */
      server: ServerMetadata
      /**
       * Client Identifier at the Authorization Server
       */
      clientId: string
      /**
       * Client Metadata, when a string is passed in it is a shorthand for passing just {@link ClientMetadata.client_secret}
       */
      metadata?: Partial<ClientMetadata> | string
      /**
       * Implementation of the Client's Authentication Method at the Authorization Server.
       */
      clientAuthentication?: ClientAuth
    }
  | {
      method: 'factory'
      configuration: (this: FastifyInstance) => Promise<Configuration>
    }

export type OpenIDCreateConfiguration = (
  this: FastifyInstance,
  options: OpenIDConfigurationOptions
) => Promise<Configuration>

export const openIDConfiguration: OpenIDCreateConfiguration = async function (
  options
) {
  switch (options.method) {
    case 'discover': {
      this.log.info(`OpenID discovery started for ${options.server}`)
      const configuration = await retry(async (_bail, attempt) => {
        try {
          return await discovery(
            options.server,
            options.clientId,
            options.metadata,
            options.clientAuthentication,
            options.options
          )
        } catch (err) {
          this.log.warn(`OpenID discovery error #${attempt} ${String(err)}`)
          throw err
        }
      }, options.retry)
      this.log.info('OpenID discovery completed')
      return configuration
    }

    case 'static':
      return new Configuration(
        options.server,
        options.clientId,
        options.metadata,
        options.clientAuthentication
      )

    case 'factory':
      return await options.configuration.call(this)
  }
}
