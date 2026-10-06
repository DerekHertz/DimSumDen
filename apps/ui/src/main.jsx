import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { SceneLab } from './scene/procedural/SceneLab.jsx';
import "./styles.css";

const lab=new URLSearchParams(window.location.search).get('lab')==='1';
createRoot(document.getElementById("root")).render(lab?<SceneLab/>:<App />);
