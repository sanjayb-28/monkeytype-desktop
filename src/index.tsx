import { render } from "solid-js/web";

function App() {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        height: "100vh",
        "background-color": "#323437",
        color: "#d1d0c5",
        "font-family": "'Roboto Mono', monospace",
      }}
    >
      <h1 style={{ color: "#e2b714" }}>Monkeytype Desktop</h1>
    </div>
  );
}

render(() => <App />, document.getElementById("app")!);
