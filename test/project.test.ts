import { assert } from 'chai'
import { useEnvironment } from './helpers'

const DEFAULTS = {
  accounts: 'remote',
  gas: 'auto',
  gasMultiplier: 1,
  gasPrice: 'auto',
  httpHeaders: {},
  timeout: 20000
}

describe('local networks config plugin', function() {
  describe('when there is no local config path', () => {
    useEnvironment(__dirname + '/helpers/fixtures/project/invalid-config')

    it('should not override any network config', function() {
      Object.entries(this.userNetworks).forEach(([networkName, userNetworkConfig]) => {
        const expectedConfig = Object.assign({}, DEFAULTS, userNetworkConfig);
        assert.deepStrictEqual(this.resolvedNetworks[networkName], expectedConfig)
      })
    })
  })

  describe('when there is a local config path', () => {
    describe('when the given local config path is not valid', () => {
      useEnvironment(__dirname + '/helpers/fixtures/project/invalid-config')

      it('should not override any network config', function() {
        Object.entries(this.userNetworks).forEach(([networkName, userNetworkConfig]) => {
          const expectedConfig = Object.assign({}, DEFAULTS, userNetworkConfig);
          assert.deepStrictEqual(this.resolvedNetworks[networkName], expectedConfig)
        })
      })
    })

    describe('when the given local config path is missing', () => {
      useEnvironment(__dirname + '/helpers/fixtures/project/missing-config')

      it('should not override any network config', function() {
        Object.entries(this.userNetworks).forEach(([networkName, userNetworkConfig]) => {
          const expectedConfig = Object.assign({}, DEFAULTS, userNetworkConfig);
          assert.deepStrictEqual(this.resolvedNetworks[networkName], expectedConfig)
        })
      })
    })

    describe('when the given local config path is valid', () => {
      const itLoadsTheLocalConfigProperly = (localConfig: any) => {
        it('should prioritize project config over local config', function() {
          const expectedConfig = Object.assign({}, DEFAULTS, this.userNetworks.shouldNotBeOverridden);
          assert.deepStrictEqual(this.resolvedNetworks.shouldNotBeOverridden, expectedConfig)
        })

        it('should extend project config with local config', function() {
          assert.deepStrictEqual(this.resolvedNetworks.shouldBeExtended, {
            ...DEFAULTS,
            ...localConfig.defaultConfig,
            ...localConfig.networks.shouldBeExtended,
            ...this.userNetworks.shouldBeExtended
          })
        })

        it('should extend project config with local config prioritizing project config', function() {
          assert.deepStrictEqual(this.resolvedNetworks.shouldBePartiallyExtended, {
            ...DEFAULTS,
            ...localConfig.defaultConfig,
            ...localConfig.networks.shouldBePartiallyExtended,
            ...this.userNetworks.shouldBePartiallyExtended
          })
        })

        it('should copy local configs', function() {
          assert.deepStrictEqual(this.resolvedNetworks.shouldBeCopiedFromLocalConfig, {
            ...localConfig.defaultConfig,
            ...localConfig.networks.shouldBeCopiedFromLocalConfig
          })
        })

        it('should extend project config with local default config', function() {
          assert.deepStrictEqual(this.resolvedNetworks.shouldBeOverriddenByDefaultConfig, {
            ...DEFAULTS,
            ...localConfig.defaultConfig,
            ...this.userNetworks.shouldBeOverriddenByDefaultConfig
          })
        })
      }

      describe('with a ts config file', () => {
        const localConfig = require('./helpers/fixtures/local/hardhat.config.ts')
        useEnvironment(__dirname + '/helpers/fixtures/project/valid-config-ts')
        itLoadsTheLocalConfigProperly(localConfig)
      })
      
      describe('with a json config file', () => {
        const localConfig = require('./helpers/fixtures/local/hardhat.config.json')
        useEnvironment(__dirname + '/helpers/fixtures/project/valid-config-json')
        itLoadsTheLocalConfigProperly(localConfig)
      })
    })
  })
})
