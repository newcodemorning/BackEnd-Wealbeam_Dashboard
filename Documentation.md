#### daily form
> - the daily form is a normal form that students fill out every day to report their mood and activities 
> - we handle the daily form by creating a new form with fixed name **"daily"** 
> - the endpoint to get the daily form is: `GET /questions/daily` 
> - the endpoint to submit the daily form is: `POST /questions` => with body ```{ formName: "daily", ...otherFields}``` 
> just like any other form submission
