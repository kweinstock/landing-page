import { fetchProjects } from "./projects";
import { renderProjects, renderMessage, messages } from "./render";
import "./styles/main.scss";

const list = document.getElementById("projects")!;

fetchProjects()
  .then((items) => renderProjects(list, items))
  .catch(() => renderMessage(list, messages.error));
