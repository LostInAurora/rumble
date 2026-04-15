import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.rumble.app',
  appName: 'Rumble',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
