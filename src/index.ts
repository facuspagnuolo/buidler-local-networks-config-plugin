import fs from 'fs'
import path from 'path'
import { homedir } from 'os'
import deepmerge from 'deepmerge'
import { extendConfig } from 'hardhat/config'
import { HardhatConfig, NetworkConfig, NetworksConfig, HardhatUserConfig } from 'hardhat/types'

const HARDHAT_CONFIG_DIR = '.hardhat'
const HARDHAT_NETWORK_DEFAULT_CONFIG_FILES = ['networks.json', 'networks.js', 'networks.ts']

export interface LocalNetworksConfig {
  networks: NetworksConfig
  defaultConfig: NetworkConfig
}

extendConfig((hardhatConfig: HardhatConfig, userConfig: HardhatUserConfig): void => {
  const localNetworksConfig = readLocalNetworksConfig(userConfig)

  const userNetworkConfigs = userConfig.networks || []
  Object.entries(userNetworkConfigs).forEach(([networkName, userNetworkConfig]) => {
    hardhatConfig.networks[networkName] = (deepmerge.all([
      hardhatConfig.networks[networkName] || {},
      localNetworksConfig.defaultConfig,
      localNetworksConfig.networks[networkName] || {},
      userNetworkConfig as object
    ]) as NetworkConfig)
  })

  Object.entries(localNetworksConfig.networks).forEach(([networkName, localNetworkConfig]) => {
    if (!hardhatConfig.networks[networkName]) {
      hardhatConfig.networks[networkName] = (deepmerge.all([
        hardhatConfig.networks[networkName] || {},
        localNetworksConfig.defaultConfig,
        localNetworkConfig
      ]) as NetworkConfig)
    }
  })
});

export function readLocalNetworksConfig(userConfig: HardhatUserConfig): LocalNetworksConfig {
  const localNetworksConfigPath = parseLocalNetworksConfigPath(userConfig)
  const localNetworksConfig = localNetworksConfigPath ? require(localNetworksConfigPath) : {}

  if (!localNetworksConfig.networks) localNetworksConfig.networks = []
  if (!localNetworksConfig.defaultConfig) localNetworksConfig.defaultConfig = {}

  return localNetworksConfig
}

export function parseLocalNetworksConfigPath(userConfig: HardhatUserConfig): string | undefined {
  const localNetworksConfigPath = userConfig.localNetworksConfig
  if (typeof localNetworksConfigPath === 'string' && fs.existsSync(localNetworksConfigPath)) {
    return localNetworksConfigPath
  }

  for (const defaultPath in getDefaultLocalNetworksConfigPaths()) {
    if (fs.existsSync(defaultPath)) return defaultPath;
  }

  return undefined;
}

export function getDefaultLocalNetworksConfigPaths() {
  return HARDHAT_NETWORK_DEFAULT_CONFIG_FILES.map(file => path.join(getLocalConfigDir(), file));
}

export function getLocalConfigDir() {
  return path.join(homedir(), HARDHAT_CONFIG_DIR)
}
