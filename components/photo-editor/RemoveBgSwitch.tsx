import styled from "styled-components";

const SwitchContainer = styled.div`
  position: relative;
  width: 56px;
  height: 28px;
  background: #2e2e2e;
  border-radius: 50px;
  box-shadow: inset -4px -4px 8px #1a1919, inset 4px 4px 8px #474747;
`;

const ToggleCheckbox = styled.input`
  display: none;
`;

const SwitchLabel = styled.label`
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 100%;
  transform: translateY(-50%);
  border-radius: 50px;
  overflow: hidden;
  cursor: pointer;
`;

const Toggle = styled.span<{ checked: boolean }>`
  position: absolute;
  width: 28px;
  height: 24px;
  background: linear-gradient(145deg, #212121, #151414);
  border-radius: 50px;
  top: 2px;
  left: ${({ checked }) => (checked ? "26px" : "2px")};
  box-shadow: ${({ checked }) =>
    checked
      ? "-2px -2px 8px #474747, 2px 2px 8px #474747"
      : "-2px -2px 6px #474747, 2px 2px 6px #474747"};
  transition: all 0.3s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 6px;
`;

const Led = styled.span<{ checked: boolean }>`
  width: 6px;
  height: 6px;
  background: ${({ checked }) => (checked ? "lime" : "grey")};
  border-radius: 50%;
  box-shadow: ${({ checked }) =>
    checked
      ? "0 0 6px 2px lime"
      : "0 0 5px 1px rgba(0, 0, 0, 0.2)"};
  transition: all 0.3s ease-in-out;
`;

export function RemoveBgSwitch({
  checked,
  onChange,
  label = "Remove Background",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <SwitchContainer>
        <ToggleCheckbox
          id="remove-bg-switch"
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <SwitchLabel htmlFor="remove-bg-switch" className="switch">
          <Toggle className="toggle" checked={checked}>
            <Led className="led" checked={checked} />
          </Toggle>
        </SwitchLabel>
      </SwitchContainer>
      <span style={{ fontWeight: 500, fontSize: 14 }}>{label}</span>
    </div>
  );
} 