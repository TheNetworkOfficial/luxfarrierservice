const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const calendar = google.calendar('v3');

async function addToGoogleCalendar(appointment) {
    try {
        const auth = new google.auth.JWT(
            process.env.GOOGLE_CLIENT_EMAIL,
            null,
            process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            SCOPES
        );

        const response = await calendar.events.insert({
            auth,
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            requestBody: {
                summary: `Farrier Appointment - ${appointment.client.firstName} ${appointment.client.lastName}`,
                start: {
                    dateTime: new Date(appointment.chosenSlot.date).toISOString(),
                    timeZone: 'America/Los_Angeles',
                },
                end: {
                    dateTime: new Date(
                        new Date(appointment.chosenSlot.date).setHours(appointment.chosenSlot.hour + 1)
                    ).toISOString(),
                    timeZone: 'America/Los_Angeles',
                },
            },
        });

        return response.data;
    } catch (error) {
        console.error('Google Calendar Error:', error);
        throw error;
    }
}

module.exports = { addToGoogleCalendar };