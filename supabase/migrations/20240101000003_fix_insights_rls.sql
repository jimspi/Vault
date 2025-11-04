-- Fix missing INSERT and DELETE policies for insights table

-- Allow users to create insights in their workspaces
CREATE POLICY "Users can create insights in their workspaces"
    ON public.insights FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Allow users to delete insights in their workspaces
CREATE POLICY "Users can delete insights in their workspaces"
    ON public.insights FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = insights.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );
