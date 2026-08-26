require 'json'
app_root = File.expand_path(File.join(__dir__, 'artifacts', 'mobile'))
app_node_modules = File.join(app_root, 'node_modules')
ENV['NODE_PATH'] = [app_node_modules, ENV['NODE_PATH']].compact.join(File::PATH_SEPARATOR)
# Expo Constants reads PROJECT_ROOT while generating its CocoaPods script phase.
# The native project lives at the workspace root, while the Expo app does not.
ENV['PROJECT_ROOT'] = app_root

def node_resolve(package_path, app_root)
  Pod::Executable.execute_command(
    'node',
    ['--print', "require.resolve('#{package_path}', { paths: [process.argv[1]] })", app_root]
  ).strip
end

expo_package = node_resolve('expo/package.json', app_root)
require File.join(File.dirname(expo_package), 'scripts/autolinking')
require File.join(File.dirname(node_resolve('react-native/package.json', app_root)), 'scripts/react_native_pods')

podfile_properties = JSON.parse(File.read(File.join(__dir__, 'Podfile.properties.json'))) rescue {}

def ccache_enabled?(podfile_properties)
  # Environment variable takes precedence
  return ENV['USE_CCACHE'] == '1' if ENV['USE_CCACHE']
  
  # Fall back to Podfile properties
  podfile_properties['apple.ccacheEnabled'] == 'true'
end

ENV['RCT_NEW_ARCH_ENABLED'] ||= '0' if podfile_properties['newArchEnabled'] == 'false'
ENV['EX_DEV_CLIENT_NETWORK_INSPECTOR'] ||= podfile_properties['EX_DEV_CLIENT_NETWORK_INSPECTOR']
ENV['RCT_USE_RN_DEP'] ||= '1' if podfile_properties['ios.buildReactNativeFromSource'] != 'true' && podfile_properties['newArchEnabled'] != 'false'
ENV['RCT_USE_PREBUILT_RNCORE'] ||= '1' if podfile_properties['ios.buildReactNativeFromSource'] != 'true' && podfile_properties['newArchEnabled'] != 'false'
platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'

prepare_react_native_project!

target 'CaloriZen' do
  use_expo_modules!(
    :appRoot => app_root,
    :projectRoot => app_root,
    :searchPaths => [app_node_modules]
  )

  if ENV['EXPO_USE_COMMUNITY_AUTOLINKING'] == '1'
    config_command = ['node', '-e', "process.argv=['', '', 'config'];require('@react-native-community/cli').run()"];
  else
    config_command = [
      'node',
      '--no-warnings',
      '--eval',
      "require('#{File.join(File.dirname(expo_package), 'bin/autolinking')}')",
      'expo-modules-autolinking',
      'react-native-config',
      '--json',
      '--platform',
      'ios',
      '--project-root',
      app_root,
      '--source-dir',
      __dir__
    ]
  end

  config = use_native_modules!(config_command)

  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => podfile_properties['expo.jsEngine'] == nil || podfile_properties['expo.jsEngine'] == 'hermes',
    # An absolute path to your application root.
    :app_path => app_root,
    :privacy_file_aggregation_enabled => podfile_properties['apple.privacyManifestAggregationEnabled'] != 'false',
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )
  end
end
