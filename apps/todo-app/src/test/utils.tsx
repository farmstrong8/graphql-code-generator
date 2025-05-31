import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
// import { MemoryRouter } from "react-router-dom";

// Custom render function that wraps components with Apollo MockedProvider and Router
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
    mocks?: MockedResponse[];
    // initialEntries?: string[];
    addTypename?: boolean;
}

export function renderWithProviders(
    ui: React.ReactElement,
    {
        mocks = [],
        // initialEntries = ["/"],
        addTypename = false,
        ...renderOptions
    }: CustomRenderOptions = {},
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <MockedProvider mocks={mocks} addTypename={addTypename}>
                {/* <MemoryRouter initialEntries={initialEntries}> */}
                {children}
                {/* </MemoryRouter> */}
            </MockedProvider>
        );
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library/react
export * from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";
