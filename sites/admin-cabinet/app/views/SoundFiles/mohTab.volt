{% for record in mohFiles %}
    {% if loop.first %}
        <table class="ui selectable compact table" id="moh-sound-files-table">
        <thead>
        <tr>
            <th>{{ t._('sf_ColumnFile') }}</th>
            <th>{{ t._('sf_ColumnPlayer') }}</th>
            <th></th>
        </tr>
        </thead>
        <tbody>
    {% endif %}
    <tr class="file-row" id="{{ record.id }}" data-value="{{ record.path }}">
        <td class="name"><i class="file audio outline icon"></i>{{ record.name }}</td>
        <td class="cdr-player">
            <table>
                <tr>
                    <td class="one wide">
                        <i class="ui icon play"></i>
                        <audio preload="metadata" id="audio-player-{{ record.id }}">
                            {% if record.path is empty %}
                                <source src=""/>
                            {% else %}
                                <source src="{{ '/pbxcore/api/cdr/playback?view='~record.path }}"/>
                            {% endif %}
                        </audio>
                    </td>
                    <td>
                        <div class="ui range cdr-player"></div>
                    </td>
                    <td class="one wide"><span class="cdr-duration"></span></td>
                    <td class="one wide">
                        {% if record.path is empty %}
                            <i class="ui icon download" data-value=""></i>
                        {% else %}
                            <i class="ui icon download" data-value="{{ '/pbxcore/api/cdr/playback?view='~record.path~'&download=1&filename='~record.name~'.mp3' }}"></i>
                        {% endif %}

                    </td>
                </tr>
            </table>
        </td>
        </td>
        {{ partial("partials/tablesbuttons",
            [
                'id': record.id,
                'edit' : 'sound-files/modify/',
                'delete': 'sound-files/delete/'
            ])
        }}
    </tr>

    {% if loop.last %}

        </tbody>
        </table>
    {% endif %}
{% endfor %}