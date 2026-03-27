import { Components } from "react-markdown";
import { CodeBlock, CodeBlockCode, Content } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

export const markdownPFComponents: Components = {
  h1: (props) => <Content component="h1" {...props} />,
  h2: (props) => <Content component="h2" {...props} />,
  h3: (props) => <Content component="h3" {...props} />,
  h4: (props) => <Content component="h4" {...props} />,
  h5: (props) => <Content component="h5" {...props} />,
  h6: (props) => <Content component="h6" {...props} />,
  p: (props) => <Content component="p" {...props} />,
  a: (props) => <Content component="a" {...props} />,
  small: (props) => <Content component="small" {...props} />,
  blockquote: (props) => <Content component="blockquote" {...props} />,
  pre: (props) => (
    <CodeBlock className={spacing.mbMd}>
      <CodeBlockCode {...props} />
    </CodeBlock>
  ),
};
