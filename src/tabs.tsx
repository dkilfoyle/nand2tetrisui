import { IDockviewPanelHeaderProps } from "dockview";
import React from "react";
import { AsmIcon, HdlIcon } from "./components/fileTree/FileTree";

export const CloseButton = () => (
  <svg height="11" width="11" viewBox="0 0 28 28" aria-hidden={"false"} focusable={false} className="dockview-svg">
    <path d="M2.1 27.3L0 25.2L11.55 13.65L0 2.1L2.1 0L13.65 11.55L25.2 0L27.3 2.1L15.75 13.65L27.3 25.2L25.2 27.3L13.65 15.75L2.1 27.3Z"></path>
  </svg>
);

export type IDockviewDefaultTabProps = IDockviewPanelHeaderProps &
  React.DOMAttributes<HTMLDivElement> & {
    hideClose?: boolean;
    closeActionOverride?: () => void;
  };

export const DockviewFileTab: React.FunctionComponent<IDockviewDefaultTabProps> = ({
  api,
  containerApi: _containerApi,
  params: _params,
  hideClose,
  closeActionOverride,
  ...rest
}) => {
  const onClose = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();

      if (closeActionOverride) {
        closeActionOverride();
      } else {
        api.close();
      }
    },
    [api, closeActionOverride]
  );

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) {
        return;
      }

      api.setActive();

      if (rest.onClick) {
        rest.onClick(event);
      }
    },
    [api, rest]
  );

  return (
    <div data-testid="dockview-default-tab" {...rest} onClick={onClick} className="dockview-react-tab">
      <span className="dockview-react-tab-title">
        <span>{_params.fileName.endsWith(".hdl") ? HdlIcon() : AsmIcon()}</span>
        {_params.fileName.substring(_params.fileName.lastIndexOf("/") + 1, _params.fileName.lastIndexOf("."))}
      </span>
      {!hideClose && (
        <div className="dv-react-tab-close-btn" style={{ padding: 0 }} onMouseDown={onMouseDown} onClick={onClose}>
          <CloseButton />
        </div>
      )}
    </div>
  );
};
