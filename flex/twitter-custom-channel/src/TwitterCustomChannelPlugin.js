import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
import { TwitterIcon, TwitterIconActive } from './Icons/TwitterIcons';
import { Icon } from '@twilio/flex-ui';

// import reducers, { namespace } from './states';

const PLUGIN_NAME = 'PluginTwitterCustomChannelPlugin';

export default class PluginTwitterCustomChannelPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {

    const definition = flex.DefaultTaskChannels.createChatTaskChannel(
      'twitter',
      (task) => {
        return task.attributes.channelType === 'twitter';
      },
      <Icon icon={<TwitterIcon />} />,
      <Icon icon={<TwitterIconActive />} />,
      '#6CADDE' // Twitter Blue
    );

    // register the definition

    flex.TaskChannels.register(definition);
  }
}
