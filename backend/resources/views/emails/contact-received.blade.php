Nuovo messaggio dal modulo contatti del portfolio.

Nome: {!! $contact->name !!}
Email: {!! $contact->email !!}
Lingua: {{ strtoupper($contact->locale) }}
Ricevuto: {{ $contact->created_at->timezone('Europe/Rome')->format('d/m/Y H:i') }}

{!! $contact->body !!}

--
Rispondi a questa email per scrivere direttamente a {!! $contact->name !!}.
Il messaggio è salvato anche nell'area admin, sezione Messaggi.
{{-- Plain-text mail: escaping would turn apostrophes and quotes into HTML entities. --}}