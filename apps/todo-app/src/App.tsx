import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TodosPage } from "./pages/TodosPage";
import { TodoDetailPage } from "./pages/TodoDetailsPage";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<TodosPage />} />
                <Route path="/todos" element={<TodosPage />} />
                <Route path="/todos/:id" element={<TodoDetailPage />} />
                <Route path="*" element={<p>Not Found</p>} />
            </Routes>
        </Router>
    );
}

export default App;
