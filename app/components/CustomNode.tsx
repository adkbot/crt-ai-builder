import { NodeProps, Handle, Position } from 'reactflow';

export default function CustomNode({ data }: NodeProps) {
    const getNodeIcon = (type: string) => {
        const icons: Record<string, string> = {
            TIME_FILTER: '⏰',
            MA: '📊',
            CROSS_UP: '📈',
            CROSS_DOWN: '📉',
            AND: '🔗',
            Q_AGENT: '🤖',
            BUY_MARKET: '💰',
            SELL_MARKET: '💸',
            CRT_SETUP: '🎯',
            SMC_SILVERBULLET: '⚡'
        };
        return icons[type] || '📦';
    };

    const getNodeColor = (type: string) => {
        const colors: Record<string, string> = {
            TIME_FILTER: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            MA: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            CROSS_UP: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            CROSS_DOWN: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            AND: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            Q_AGENT: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            BUY_MARKET: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            SELL_MARKET: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            CRT_SETUP: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            SMC_SILVERBULLET: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)'
        };
        return colors[type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };

    return (
        <div className="custom-node" style={{
            background: getNodeColor(data.nodeType),
        }}>
            <Handle
                type="target"
                position={Position.Left}
                className="custom-handle"
            />

            <div className="node-header">
                <div className="node-icon">{getNodeIcon(data.nodeType)}</div>
            </div>

            <div className="node-content">
                <div className="node-title">{data.label}</div>

                {data.enabled !== undefined && (
                    <div className="node-status">
                        <div className={`status-indicator ${data.enabled ? 'active' : 'inactive'}`}></div>
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="custom-handle"
            />

            <div className="node-glow"></div>
        </div>
    );
}
