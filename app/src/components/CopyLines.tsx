import { Fragment } from 'react';

const CopyLines = ({ text }: { text: string }) => (
  <>
    {text.split('\n').map((line, index) => (
      <Fragment key={`${index}-${line}`}>
        {index > 0 ? <br /> : null}
        {line}
      </Fragment>
    ))}
  </>
);

export default CopyLines;
