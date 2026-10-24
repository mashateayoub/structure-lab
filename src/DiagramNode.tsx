import { Handle, Position, type NodeProps } from "@xyflow/react";
import { sides } from "./diagramLayout";
export function DiagramNode({ data }: NodeProps) {
  const ports =
    (data.ports as
      | { id: string; side: Position; offset: number }[]
      | undefined) || sides.map((side) => ({ id: side, side, offset: 50 }));
  return (
    <div className="readable-node-label">
      {String(data.label)}
      {ports.map((port) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={port.side}
          style={
            port.side === Position.Top || port.side === Position.Bottom
              ? { left: `${port.offset}%` }
              : { top: `${port.offset}%` }
          }
        />
      ))}
    </div>
  );
}
export const diagramNodeTypes = { readable: DiagramNode };
