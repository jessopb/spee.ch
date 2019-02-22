import React from 'react';
import ChannelLoginForm from '@containers/ChannelLoginForm';
import ChannelCreateForm from '@containers/ChannelCreateForm';
import { LOGIN, CREATE } from '../../constants/publish_channel_select_states';
import RowLabeled from '@components/RowLabeled';
import ChooseAnonymousPublishRadio from '@components/ChooseAnonymousPublishRadio';
import ChooseChannelPublishRadio from '@components/ChooseChannelPublishRadio';
import FormFeedbackDisplay from '@components/FormFeedbackDisplay';
import Label from '@components/Label';
import ChannelSelectDropdown from '@components/ChannelSelectDropdown';

class ChannelSelect extends React.Component {
  constructor (props) {
    super(props);
    this.toggleAnonymousPublish = this.toggleAnonymousPublish.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
  }
  componentWillMount () {
    const { loggedInChannelName, onChannelSelect, publishOnlyApproved, onPublishInChannelChange } = this.props;
    if (loggedInChannelName) {
      onPublishInChannelChange(true);
    }
    if (publishOnlyApproved) {
      onPublishInChannelChange(true);
    }
  }
  toggleAnonymousPublish (event) {
    const value = event.target.value;
    if (value === 'anonymous') {
      this.props.onPublishInChannelChange(false);
    } else {
      this.props.onPublishInChannelChange(true);
    }
  }
  handleSelection (event) {
    const selectedOption = event.target.selectedOptions[0].value;
    this.props.onChannelSelect(selectedOption);
  }
  render () {
    let { publishInChannel, channelError, selectedChannel, loggedInChannelName, publishOnlyApproved } = this.props;
    if (loggedInChannelName) {
      publishInChannel = 'checked';
    }
    if (publishOnlyApproved) {
      return (
        <React.Fragment>
          <RowLabeled
            label={<Label value={'Channel:'} />}
            content={<span>{loggedInChannelName}</span>}
          />
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <RowLabeled
          label={
            <ChooseAnonymousPublishRadio
              publishInChannel={publishInChannel}
              toggleAnonymousPublish={this.toggleAnonymousPublish}
            />
          }
          content={
            <ChooseChannelPublishRadio
              publishInChannel={publishInChannel}
              toggleAnonymousPublish={this.toggleAnonymousPublish}
            />
          }
        />
        <FormFeedbackDisplay
          errorMessage={channelError}
          defaultMessage={'Publish anonymously or in a channel'}
        />

        { this.props.publishInChannel && (
          <div>
            <RowLabeled
              label={
                <Label value={'Channel:'} />
              }
              content={
                <ChannelSelectDropdown
                  selectedChannel={selectedChannel}
                  handleSelection={this.handleSelection}
                  loggedInChannelName={loggedInChannelName}
                />
              }
            />
            { (selectedChannel === LOGIN) && <ChannelLoginForm /> }
            { (selectedChannel === CREATE) && <ChannelCreateForm /> }
          </div>
        )}
      </React.Fragment>
    );
  }
}

export default ChannelSelect;
