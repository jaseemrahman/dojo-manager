# Deployment Guide

This guide explains how to deploy the **Dojo Manager** application to **Render.com** (a free hosting provider for Full Stack apps).

## Prerequisites

1.  **GitHub Account**: You need a GitHub account.
2.  **Render Account**: Sign up at [dashboard.render.com](https://dashboard.render.com/) using your GitHub account.

## Step 1: Push Code to GitHub

We have initialized the Git repository. You need to push the code to your GitHub repository.

Run the following command in your terminal:

```bash
git push -u origin main
```

*(You will be asked to enter your GitHub username and password/token. If you use Two-Factor Authentication, you must use a **Personal Access Token** instead of your password).*

## Step 2: Deploy on Render

1.  Log in to your **Render Dashboard**.
2.  Click on **New +** button and select **Blueprint**.
3.  Connect your GitHub account if not already connected.
4.  Select the `dojo-manager` repository from the list.
5.  Render will automatically detect the `render.yaml` file.
6.  Click **Apply**.

Render will now:
1.  Create a **PostgreSQL Database** (Free).
2.  Build and deploy the **Django Backend** (Free).
3.  Build and deploy the **React Frontend** (Free).

## Troubleshooting

-   **Build Failures**: Check the logs in the Render dashboard. Common issues include missing dependencies in `requirements.txt`.
-   **Database**: The database is automatically connected via the `DATABASE_URL` environment variable.
-   **Environment Variables**: If you need additional secrets, add them in the `render.yaml` or in the Render Dashboard under **Environment**.
