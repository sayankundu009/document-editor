import TreeStructure from "../TreeStructure";
import "./style.css";

const initialData = [
    {
        id: 1,
        label: "Project roadmap",
        is_open: true,
        is_folder: true,
        parent_id: 0,
        children: [
            { id: 11, label: "Priority list", parent_id: 1 },
            { id: 12, label: "Website tasks", parent_id: 1 },
            { id: 13, label: "Projects", parent_id: 1 },
            {
                id: 14,
                label: "Tasks",
                parent_id: 1,
                is_folder: true,
                children: [
                    { id: 141, label: "Task 1", parent_id: 14 },
                    {
                        id: 142,
                        label: "Task 2",
                        parent_id: 14,
                        is_folder: true,
                        children: [
                            { id: 1421, label: "Task 2.1", parent_id: 142 },
                            { id: 1422, label: "Task 2.2", parent_id: 142 },
                        ],
                    },
                    { id: 143, label: "Task 3", parent_id: 14 },
                ],
            },
            { id: 15, label: "Screenshots", parent_id: 1 },
            { id: 16, label: "Mobile", parent_id: 1 },
        ],
    },
    {
        id: 2,
        label: "Sayan's Docs",
        is_open: false,
        is_folder: true,
        parent_id: 0,
        children: [
            { id: 21, label: "Project Section Eve...", parent_id: 2 },
            { id: 22, label: "Project Role List & P...", parent_id: 2 },
            { id: 23, label: "Event List for Projec...", parent_id: 2 },
        ],
    },
];

export default function Sidebar() {
    return (
        <div>
            <TreeStructure data={initialData} />
        </div>
    );
}