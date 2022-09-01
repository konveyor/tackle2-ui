import * as React from 'react';
import { Button } from '@patternfly/react-core';
import EyeSlashIcon from '@patternfly/react-icons/dist/js/icons/eye-slash-icon';
import EyeIcon from '@patternfly/react-icons/dist/js/icons/eye-icon';
// TODO this is a good candidate for lib-ui

interface IKeyDisplayToggleProps {
  keyName: string;
  isKeyHidden: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const KeyDisplayToggle: React.FunctionComponent<IKeyDisplayToggleProps> = ({
  keyName,
  isKeyHidden,
  onClick,
}: IKeyDisplayToggleProps) => (
  <Button variant="link" aria-label={`Show/hide ${keyName}`} onClick={onClick}>
    <span className="pf-c-icon pf-m-info">{isKeyHidden ? <EyeSlashIcon /> : <EyeIcon />}</span>
  </Button>
);

export default KeyDisplayToggle;
