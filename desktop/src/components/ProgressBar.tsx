interface Props {
  currentTime: number;
  duration:    number;
}

function ProgressBar({ currentTime, duration }: Props) {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      width: "100%",
      height: "3px",
      background: "rgba(255,255,255,0.1)",
      borderRadius: "2px",
      overflow: "hidden",
      marginTop: "10px",
    }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        background: "rgba(255,255,255,0.6)",
        borderRadius: "2px",
        transition: "width 1s linear",  
      }} />
    </div>
  );
}

export default ProgressBar;