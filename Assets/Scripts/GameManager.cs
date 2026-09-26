using System;
using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class GameManager : MonoBehaviour
{
    public Text ui_health, ui_score, ui_enemy;
    public Image h1, h2, h3, h1a, h2a, h3a;
    public Image end;
    [NonSerialized] public static int playerHealth;
    [NonSerialized] public static int score = 0;
    [NonSerialized] public static int coins = 0;
    [NonSerialized] public static int enemyCount, maxEnemyCount;
    // Start is called before the first frame update
    void Start()
    {
        foreach (var i in GameObject.FindGameObjectsWithTag("enemigo"))
        {
            maxEnemyCount++;
        }
        enemyCount = maxEnemyCount;
        if (Time.timeScale != 1) { Time.timeScale = 1; }
    }

    // Update is called once per frame
    void Update()
    {
        //ui_health.text = "HP: " + playerHealth;
        ui_score.text = "PUNTOS: " + score;
        ui_enemy.text = "ENEMIGOS: " + enemyCount + "/" + maxEnemyCount;

        if (playerHealth < 0)
        {
            playerHealth = 0;
        }

        switch (playerHealth)
        {
            case 0:
                h1.gameObject.SetActive(false);
                h2.gameObject.SetActive(false);
                h3.gameObject.SetActive(false);
                h1a.gameObject.SetActive(true);
                h2a.gameObject.SetActive(true);
                h3a.gameObject.SetActive(true);
                break;
            case 1:
                h1.gameObject.SetActive(true);
                h2.gameObject.SetActive(false);
                h3.gameObject.SetActive(false);
                h1a.gameObject.SetActive(false);
                h2a.gameObject.SetActive(true);
                h3a.gameObject.SetActive(true);
                break;
            case 2:
                h1.gameObject.SetActive(true);
                h2.gameObject.SetActive(true);
                h3.gameObject.SetActive(false);
                h1a.gameObject.SetActive(false);
                h2a.gameObject.SetActive(false);
                h3a.gameObject.SetActive(true);
                break;
            default:
                h1.gameObject.SetActive(true);
                h2.gameObject.SetActive(true);
                h3.gameObject.SetActive(true);
                h1a.gameObject.SetActive(false);
                h2a.gameObject.SetActive(false);
                h3a.gameObject.SetActive(false);
                break;
        }
        if (enemyCount == 0 && maxEnemyCount != 0)
        {
            Time.timeScale = 0;
            end.gameObject.SetActive(true);
        }
        if (coins == 5 && playerHealth < 3)
        {
            playerHealth++;
            coins = 0;
        }
    }
    public void creditos_()
    {
        SceneManager.LoadScene("creditos");
        score = 0;
        enemyCount = 0;
        maxEnemyCount = 0;
        coins = 0;
    }

    public void titulo()
    {
        SceneManager.LoadScene("titulo");
        score = 0;
        enemyCount = 0;
        maxEnemyCount = 0;
        coins = 0;
    }
}
